package com.talkes.wifi

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.net.wifi.p2p.WifiP2pManager.ActionListener
import android.net.wifi.p2p.WifiP2pManager.Channel
import android.net.wifi.p2p.WifiP2pManager.ConnectionInfoListener
import android.net.wifi.p2p.WifiP2pManager.PeerListListener
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.*
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.Executors

class WiFiDirectModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val wifiP2pManager: WifiP2pManager? =
        reactContext.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager?

    private val wifiManager =
        reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    private var channel: Channel? = null
    private val executor = Executors.newSingleThreadExecutor()
    private var serverSocket: ServerSocket? = null

    private val TRANSFER_PORT = 8888

    init {
        initializeP2p()
    }

    private fun initializeP2p() {
        channel = wifiP2pManager?.initialize(
            reactContext,
            Looper.getMainLooper(),
            WifiP2pManager.ChannelListener { }
        )
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun isWifiP2pSupported(promise: Promise) {
        try {
            val supported = reactContext.packageManager
                .hasSystemFeature("android.hardware.wifi.direct")
            promise.resolve(supported)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun startDiscovery(promise: Promise) {
        if (ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject("LOCATION_PERMISSION_DENIED", "Location permission not granted")
            return
        }

        val peersListener = PeerListListener { peers ->
            val params = Arguments.createMap()
            val peerArray = Arguments.createArray()
            for (device in peers.deviceList) {
                val peerMap = Arguments.createMap()
                peerMap.putString("deviceAddress", device.deviceAddress)
                peerMap.putString(
                    "deviceName",
                    device.deviceName ?: "Unknown"
                )
                peerArray.pushMap(peerMap)
            }
            params.putArray("peers", peerArray)
            sendEvent("WiFiDirectPeersFound", params)
        }

        wifiP2pManager?.requestPeers(channel, peersListener)
        promise.resolve(true)
    }

    @ReactMethod
    fun connectToDevice(deviceAddress: String, promise: Promise) {
        if (ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject("LOCATION_PERMISSION_DENIED", "Location permission not granted")
            return
        }

        val config = WifiP2pConfig()
        config.deviceAddress = deviceAddress

        wifiP2pManager?.connect(channel, config, object : ActionListener {
            override fun onSuccess() {
                sendEvent("WiFiDirectConnecting", null)
            }

            override fun onFailure(reason: Int) {
                promise.reject("CONNECT_FAILED", "Connection failed: $reason")
            }
        })

        wifiP2pManager?.requestConnectionInfo(channel, object : ConnectionInfoListener {
            override fun onConnectionInfoAvailable(info: WifiP2pInfo) {
                val params = Arguments.createMap()
                val groupOwnerAddress = info.groupOwnerAddress?.hostAddress ?: ""
                params.putString("groupOwnerAddress", groupOwnerAddress)
                params.putBoolean("isGroupOwner", info.isGroupOwner)
                params.putString("deviceAddress", "")
                sendEvent("WiFiDirectConnected", params)
                promise.resolve(true)
            }
        })
    }

    @ReactMethod
    fun createGroup(promise: Promise) {
        wifiP2pManager?.createGroup(channel, object : ActionListener {
            override fun onSuccess() {
                promise.resolve(true)
            }

            override fun onFailure(reason: Int) {
                promise.reject("CREATE_GROUP_FAILED", "Failed: $reason")
            }
        })
    }

    @ReactMethod
    fun removeGroup(promise: Promise) {
        wifiP2pManager?.removeGroup(channel, object : ActionListener {
            override fun onSuccess() {
                stopServer()
                promise.resolve(true)
            }

            override fun onFailure(reason: Int) {
                promise.reject("REMOVE_GROUP_FAILED", "Failed: $reason")
            }
        })
    }

    @ReactMethod
    fun startServer(promise: Promise) {
        if (serverSocket?.isBound == true) {
            promise.resolve(true)
            return
        }

        try {
            serverSocket = ServerSocket(TRANSFER_PORT)
            executor.execute {
                sendEvent("ServerStarted", null)

                while (true) {
                    val clientSocket = serverSocket?.accept() ?: break
                    handleClient(clientSocket)
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVER_START_FAILED", e.message ?: "Failed to start server")
        }
    }

    @ReactMethod
    fun stopServer(promise: Promise) {
        try {
            stopServer()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_SERVER_FAILED", e.message ?: "Failed to stop server")
        }
    }

    private fun stopServer() {
        try {
            serverSocket?.close()
        } catch (ignored: Exception) {
        }
        serverSocket = null
    }

    @ReactMethod
    fun sendFile(filePath: String, peerAddress: String, promise: Promise) {
        executor.execute {
            var socket: Socket? = null
            var output: java.io.OutputStream? = null
            var input: FileInputStream? = null
            try {
                val file = File(filePath)
                val fileSize = file.length()
                val fileName = file.name

                socket = Socket()
                socket?.connect(InetSocketAddress(peerAddress, TRANSFER_PORT), 30000)
                output = socket?.getOutputStream()
                input = FileInputStream(file)

                val metadata = "$fileName|$fileSize\n"
                output?.write(metadata.toByteArray())
                output?.flush()

                val buffer = ByteArray(8192)
                var totalSent = 0L
                var bytesRead: Int

                while (true) {
                    bytesRead = input?.read(buffer) ?: -1
                    if (bytesRead == -1) break
                    output?.write(buffer, 0, bytesRead)
                    totalSent += bytesRead
                    val progress = (totalSent * 100 / fileSize).toInt()
                    val progressParams = Arguments.createMap()
                    progressParams.putInt("progress", progress)
                    progressParams.putLong("bytesSent", totalSent)
                    progressParams.putLong("totalBytes", fileSize)
                    sendEvent("FileTransferProgress", progressParams)
                }

                output?.flush()
                promise.resolve(true)

                val resultParams = Arguments.createMap()
                resultParams.putString("filePath", filePath)
                resultParams.putString("fileName", fileName)
                resultParams.putLong("fileSize", fileSize)
                resultParams.putString("peerAddress", peerAddress)
                sendEvent("FileTransferComplete", resultParams)
            } catch (e: Exception) {
                promise.reject("SEND_FILE_FAILED", e.message ?: "Failed to send file")
            } finally {
                try {
                    input?.close()
                    output?.close()
                    socket?.close()
                } catch (ignored: Exception) {
                }
            }
        }
    }

    private fun handleClient(socket: Socket) {
        var input: InputStream? = null
        var output: FileOutputStream? = null
        try {
            input = socket.inputStream
            val reader = java.io.BufferedReader(InputStreamReader(input))

            val metadataLine = reader.readLine()
            val parts = metadataLine.split("|")
            val fileName = parts[0]
            val fileSize = parts[1].toLong()

            val tempDir = reactContext.cacheDir
            val outputFile = File(tempDir, fileName)
            output = FileOutputStream(outputFile)

            val buffer = ByteArray(8192)
            var totalReceived = 0L
            var bytesRead: Int

            while (totalReceived < fileSize) {
                bytesRead = input.read(buffer)
                if (bytesRead == -1) break
                output?.write(buffer, 0, bytesRead)
                totalReceived += bytesRead
                val progress = (totalReceived * 100 / fileSize).toInt()
                val progressParams = Arguments.createMap()
                progressParams.putInt("progress", progress)
                progressParams.putLong("bytesReceived", totalReceived)
                progressParams.putLong("totalBytes", fileSize)
                sendEvent("FileReceivingProgress", progressParams)
            }

            output?.close()
            socket.close()

            val resultParams = Arguments.createMap()
            resultParams.putString("filePath", outputFile.absolutePath)
            resultParams.putString("fileName", fileName)
            resultParams.putLong("fileSize", fileSize)
            sendEvent("FileReceived", resultParams)
        } catch (e: Exception) {
            val params = Arguments.createMap()
            params.putString("error", e.message ?: "Unknown error")
            sendEvent("FileReceiveError", params)
        } finally {
            try {
                input?.close()
                output?.close()
                socket.close()
            } catch (ignored: Exception) {
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    companion object {
        const val NAME = "WiFiDirect"
    }
}
