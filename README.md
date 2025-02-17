# team56-server Acts as middleware between the db, server and arduino itself

 # **Team Members**

Connect with us on LinkedIn.

Aman Shaikh: [LinkedIn](https://www.linkedin.com/in/aman-shaikh33/)  
Jay Patil: [LinkedIn](https://www.linkedin.com/in/jay-patil-562046285/)  
Dhruv Choudhary: [LinkedIn](https://www.linkedin.com/in/dhruv-choudhary-ab0421291/)                     
Aditya Jadhav: [LinkedIn](https://www.linkedin.com/in/aditya-jadhav-83574a347/)


# Other Repos of the same project that work hand-in-hand:

Frontend UI - https://github.com/m4xy07/team56-frontend
Backend - Arduino - https://github.com/m4xy07/team56-backend
Server - Middleware - https://github.com/m4xy07/team56-server
Panel - WebView Dashboard - https://github.com/m4xy07/team56-cropsense-panel

**Project Video** - https://youtu.be/zj87L2JrtaQ

A Backend data collector and processor that uses expressjs and MongoDB to accept data sent via a HTTP Post request from the Arduino Uno R4 WiFi and then stores it in a database. The stored data can then be used to further process stuff.

Example of Arduino Code and request JSON that it accepts:

```
void loop(){
WiFiClient client;
if (client.connect(host, port)) {
    Serial.println("Connected to server");

    // Create a JSON object
StaticJsonDocument<200> jsonDoc;
// Create a JSON object in the buffer
JsonObject jsonData = jsonDoc.to<JsonObject>();

// Add the data to the JSON object
jsonData["time"] = String(currentTime);
jsonData["temperature"] = Temperature;
//More Data according to your needs.

    // Convert the JSON object to a string
String jsonString;
serializeJson(jsonDoc, jsonString);

    // Send the JSON string to the server
    client.print("POST /data HTTP/1.1\r\n");
    client.print("Host: " + String(host) + "\r\n");
    client.print("Content-Type: application/json\r\n");
    client.print("Content-Length: " + String(jsonString.length()) + "\r\n");
    client.print("\r\n");
    client.print(jsonString);

    // Read the response from the server (Debugging)
    Serial.println("Reading response");
    while (client.connected()) {
      while (client.available()) {
        char c = client.read();
        Serial.write(c);
      }
    }

    // Close the connection
    client.stop();
  } else {
    Serial.println("Connection to server failed");
  }
}
```

and JSON Content it sends `{"time":"2024-04-08T23:43:09","temperature":33.09999847,"humidity":30.20000076,"aqi":269,"hi":32.15259933,"raining":"No","wifi_strength":-55}`

You also need to pass content length within the request. As you can see in the arduino code above
