#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <SPI.h>
#include <MFRC522.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

#define RELAY_PIN D4
#define WIFI_SSID "The_Game"
#define WIFI_PASSWORD "perdiste"
#define FIREBASE_HOST "https://control-acceso-9b227-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "x8d9T04jCWGAL7A5dCXGtQcIrw6m4lAPzhcKrLZP"

// Pines RFID
#define SS_PIN D2
#define RST_PIN D1
MFRC522 rfid(SS_PIN, RST_PIN);

// Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Tiempo
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", -18000, 60000);  // UTC-5 México

String ultimoEstado = "";
unsigned long ultimaLecturaRFID = 0;

void abrirCerradura() {
  digitalWrite(RELAY_PIN, HIGH);
  //delay(1500);  // Tiempo de apertura
  //digitalWrite(RELAY_PIN, LOW);
  Serial.println("Cerradura abierta");
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Cerrada por defecto

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Tiempo
  timeClient.begin();
  timeClient.update();
}

void loop() {
  // --- Lectura del estado de la cerradura desde Firebase ---
  if (Firebase.getString(fbdo, "/aulas/2CF4327BD98C/estado")) {
    String estado = fbdo.stringData();

    if (estado != ultimoEstado) {
      ultimoEstado = estado;
      if (estado == "ABIERTO") {
        abrirCerradura();
      } else if (estado == "CERRADO") {
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Cerradura CERRADA (desde Firebase)");
      }
    }
  } else {
    Serial.println("Error al leer Firebase: " + fbdo.errorReason());
  }

  // --- Detección RFID segura ---
  unsigned long tiempoInicio = millis();
  bool tarjetaLeida = false;

  while (millis() - tiempoInicio < 1000) {  // Tiempo límite 1 segundo
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      tarjetaLeida = true;
      break;
    }
    delay(50);
  }

  if (tarjetaLeida) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uid += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    Serial.println("UID detectado: " + uid);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    // Verificar permisos
    if (Firebase.getBool(fbdo, "/Profesores/" + uid + "/permisos") && fbdo.boolData()) {
      Serial.println("Tarjeta autorizada.");

      String nombreUsuario = "Desconocido";
      if (Firebase.getString(fbdo, "/Profesores/" + uid + "/nombre")) {
        nombreUsuario = fbdo.stringData();
      }

      // Cambiar estado de Firebase (esto activará la cerradura por loop)
      if (Firebase.setString(fbdo, "/aulas/2CF4327BD98C/estado", "ABIERTO")) {
        Serial.println("Estado en Firebase actualizado a ABIERTO");
                digitalWrite(RELAY_PIN, HIGH);


        // Guardar historial
        timeClient.update();
        String fecha = timeClient.getFormattedTime();
        FirebaseJson json;
        json.add("accion", "ABIERTO por RFID");
        json.add("fecha", fecha);
        json.add("nombre", nombreUsuario);
        Firebase.pushJSON(fbdo, "/accesos/2CF4327BD98C", json);
      }
    } else {
      Serial.println("Tarjeta NO autorizada.");
    }

    delay(2000);  // Espera antes de permitir otra lectura
    Firebase.setString(fbdo, "/aulas/2CF4327BD98C/estado", "CERRADO");
            Serial.println("Estado en Firebase actualizado a CERRADO");
        digitalWrite(RELAY_PIN, LOW);

  }

  delay(300);
}
