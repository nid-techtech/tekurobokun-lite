/*
 * Dual Motor Controller for TB6612FNG
 * Receives serial commands in format "L,R\n"
 * Maps L and R speed (-100 to 100) to PWM values (0-255)
 */

const int pinSTBY = 3;

// Track A (Left)
const int pinAin1 = 4;
const int pinAin2 = 5;
const int pinPWMA = 9;

// Track B (Right)
const int pinBin1 = 6;
const int pinBin2 = 7;
const int pinPWMB = 10;

void setup() {
  Serial.begin(115200);
  
  pinMode(pinSTBY, OUTPUT);
  
  pinMode(pinAin1, OUTPUT);
  pinMode(pinAin2, OUTPUT);
  pinMode(pinPWMA, OUTPUT);
  
  pinMode(pinBin1, OUTPUT);
  pinMode(pinBin2, OUTPUT);
  pinMode(pinPWMB, OUTPUT);
  
  // Enable TB6612FNG
  digitalWrite(pinSTBY, HIGH);
  
  // Initialize to Stop
  stopMotors();
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.length() > 0) {
      int commaIndex = cmd.indexOf(',');
      if (commaIndex > 0) {
        String lStr = cmd.substring(0, commaIndex);
        String rStr = cmd.substring(commaIndex + 1);
        
        int lSpeed = lStr.toInt();
        int rSpeed = rStr.toInt();
        
        setMotors(lSpeed, rSpeed);
      }
    }
  }
}

void setMotors(int lSpeed, int rSpeed) {
  // Constrain inputs to valid percentage range
  lSpeed = constrain(lSpeed, -100, 100);
  rSpeed = constrain(rSpeed, -100, 100);

  // Track A (Left) - Fixed Polarity (Ain1=HIGH, Ain2=LOW for forward)
  if (lSpeed == 0) {
    digitalWrite(pinAin1, LOW);
    digitalWrite(pinAin2, LOW);
    analogWrite(pinPWMA, 0);
  } else if (lSpeed > 0) {
    // Forward polarity for Track A 
    // Was: LOW, HIGH -> Now: HIGH, LOW
    digitalWrite(pinAin1, HIGH);
    digitalWrite(pinAin2, LOW);
    int pwm = map(lSpeed, 0, 100, 0, 255);
    analogWrite(pinPWMA, pwm);
  } else {
    // Reverse polarity for Track A
    // Was: HIGH, LOW -> Now: LOW, HIGH
    digitalWrite(pinAin1, LOW);
    digitalWrite(pinAin2, HIGH);
    int pwm = map(-lSpeed, 0, 100, 0, 255);
    analogWrite(pinPWMA, pwm);
  }

  // Track B (Right)
  if (rSpeed == 0) {
    digitalWrite(pinBin1, LOW);
    digitalWrite(pinBin2, LOW);
    analogWrite(pinPWMB, 0);
  } else if (rSpeed > 0) {
    // Forward polarity for Track B (Bin1=HIGH, Bin2=LOW)
    digitalWrite(pinBin1, HIGH);
    digitalWrite(pinBin2, LOW);
    int pwm = map(rSpeed, 0, 100, 0, 255);
    analogWrite(pinPWMB, pwm);
  } else {
    // Reverse polarity for Track B
    digitalWrite(pinBin1, LOW);
    digitalWrite(pinBin2, HIGH);
    int pwm = map(-rSpeed, 0, 100, 0, 255);
    analogWrite(pinPWMB, pwm);
  }
}

void stopMotors() {
  digitalWrite(pinAin1, LOW);
  digitalWrite(pinAin2, LOW);
  digitalWrite(pinBin1, LOW);
  digitalWrite(pinBin2, LOW);
  analogWrite(pinPWMA, 0);
  analogWrite(pinPWMB, 0);
}
