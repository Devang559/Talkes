package com.talkes.ble

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelUuid
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.UUID

class BleAdvertiserModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val serviceUuid =
        UUID.fromString("0000feed-0000-1000-8000-00805f9b34fb")

    private val rxUuid =
        UUID.fromString("0000babe-0000-1000-8000-00805f9b34fb")

    private var bluetoothManager: BluetoothManager? = null
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bleAdvertiser: BluetoothLeAdvertiser? = null
    private var gattServer: BluetoothGattServer? = null
    private var advertiseCallback: AdvertiseCallback? = null

    override fun getName(): String = "BleAdvertiser"

    private fun ensureBluetoothManager() {
        if (bluetoothManager == null) {
            bluetoothManager =
                reactContext.getSystemService(Context.BLUETOOTH_SERVICE)
                    as BluetoothManager

            bluetoothAdapter = bluetoothManager?.adapter
        }
    }

    @ReactMethod
    fun startAdvertising(
        talkesId: String,
        name: String,
        promise: Promise
    ) {
        ensureBluetoothManager()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (
                ActivityCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.BLUETOOTH_ADVERTISE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject(
                    "PERMISSION_DENIED",
                    "BLUETOOTH_ADVERTISE permission not granted"
                )
                return
            }
        }

        if (bluetoothAdapter?.isEnabled != true) {
            promise.reject(
                "BLUETOOTH_DISABLED",
                "Bluetooth is not enabled"
            )
            return
        }

        bleAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser

        if (bleAdvertiser == null) {
            promise.reject(
                "ADVERTISER_NULL",
                "BLE advertiser is not available"
            )
            return
        }

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(
                AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY
            )
            .setTxPowerLevel(
                AdvertiseSettings.ADVERTISE_TX_POWER_HIGH
            )
            .setConnectable(true)
            .build()

         val advertiseData = AdvertiseData.Builder()
             .addServiceUuid(ParcelUuid(serviceUuid))
             .addServiceData(
                 ParcelUuid(serviceUuid),
                 talkesId.toByteArray(Charsets.UTF_8)
             )
             .setIncludeDeviceName(false)
             .build()

        val gattServerCallback =
            object : BluetoothGattServerCallback() {

                override fun onCharacteristicWriteRequest(
                    device: BluetoothDevice,
                    requestId: Int,
                    characteristic: BluetoothGattCharacteristic,
                    preparedWrite: Boolean,
                    responseNeeded: Boolean,
                    offset: Int,
                    value: ByteArray
                ) {
                    val message =
                        String(value, Charsets.UTF_8)

                    val params = Arguments.createMap()

                    params.putString(
                        "message",
                        message
                    )

                    params.putString(
                        "deviceAddress",
                        device.address ?: ""
                    )

                    sendEvent(
                        "BleMessageReceived",
                        params
                    )

                    if (responseNeeded) {
                        gattServer?.sendResponse(
                            device,
                            requestId,
                            BluetoothGatt.GATT_SUCCESS,
                            offset,
                            null
                        )
                    }
                }
            }

        val service = BluetoothGattService(
            serviceUuid,
            BluetoothGattService.SERVICE_TYPE_PRIMARY
        )

        val rxCharacteristic = BluetoothGattCharacteristic(
            rxUuid,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )

        service.addCharacteristic(rxCharacteristic)

        gattServer =
            bluetoothManager?.openGattServer(
                reactContext,
                gattServerCallback
            )

        if (gattServer == null) {
            promise.reject(
                "GATT_SERVER_FAILED",
                "Unable to open GATT server"
            )
            return
        }

        gattServer?.addService(service)

        advertiseCallback =
            object : AdvertiseCallback() {

                override fun onStartSuccess(
                    settingsInEffect: AdvertiseSettings
                ) {
                    sendEvent(
                        "BleAdvertisingStarted",
                        null
                    )

                    promise.resolve(true)
                }

                override fun onStartFailure(
                    errorCode: Int
                ) {
                    promise.reject(
                        "ADVERTISE_FAILED",
                        "Failed to start BLE advertising: $errorCode"
                    )
                }
            }

        bleAdvertiser?.startAdvertising(
            settings,
            advertiseData,
            advertiseCallback
        )
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        try {
            advertiseCallback?.let { callback ->
                bleAdvertiser?.stopAdvertising(callback)
            }

            gattServer?.close()
            gattServer = null
            advertiseCallback = null
            bleAdvertiser = null

            sendEvent(
                "BleAdvertisingStopped",
                null
            )

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(
                "STOP_FAILED",
                e.message ?: "Failed to stop BLE advertising"
            )
        }
    }

    @ReactMethod
    fun isAdvertising(promise: Promise) {
        promise.resolve(
            bleAdvertiser != null &&
                advertiseCallback != null
        )
    }

    private fun sendEvent(
        eventName: String,
        params: WritableMap?
    ) {
        reactContext
            .getJSModule(
                DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
            .emit(eventName, params)
    }
}