const int pinoSensorGas = A0;
const int pinoSensorChama = 2;
const int pinoSensorPorta = 3;

const int limiteGas = 400;

void setup() {
  pinMode(pinoSensorChama, INPUT);
  pinMode(pinoSensorPorta, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int leituraGas = analogRead(pinoSensorGas);
  int leituraChama = digitalRead(pinoSensorChama);
  int leituraPorta = digitalRead(pinoSensorPorta);

  if (leituraGas > limiteGas) {
    Serial.println("ALERTA_GAS");
  } else if (leituraChama == LOW) {
    Serial.println("ALERTA_CHAMA");
  } else if (leituraPorta == HIGH) {
    Serial.println("ALERTA_PORTA");
  }

  delay(1000);
}
