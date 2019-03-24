String readData;
const int Pin2 = 2;
const int Pin3 = 3;
const int Pin4 = 4;
bool Pin2On = false;
bool Pin3On = false;
bool Pin4On = false;
volatile long TimePin2 = 0;
volatile long TimePin3 = 0;
volatile long TimePin4 = 0;
volatile long CurrentTime = 0;
long int TimeOnMillis2 = 60000;
long int TimeOnMillis3 = 60000;
long int TimeOnMillis4 = 60000;

void setup() 
{
  Serial.begin(9600);
  pinMode(Pin2,OUTPUT);
  pinMode(Pin3,OUTPUT);
  pinMode(Pin4,OUTPUT); 
  digitalWrite(Pin2,LOW);
  digitalWrite(Pin3,LOW);
  digitalWrite(Pin4,LOW);
}

void loop() 
{
  if(Serial.available())
  {
    readData = Serial.readStringUntil('\n');
  }
  if(readData == "11")
  {
    if(!Pin2On) //gdy dany pin nie jest wlaczony to wlacz
    {
      digitalWrite(Pin2,HIGH);
      readData = "";
      TimePin2 = millis();
      Pin2On = true;
    }
  }
  else if(readData == "10")
  {
    if(!Pin3On) //gdy dany pin nie jest wlaczony to wlacz
    {
      digitalWrite(Pin3,HIGH);
      readData = "";
      TimePin3 = millis();
      Pin3On = true;
    }
  }
  else if(readData == "01")
  {
    if(!Pin4On) //gdy dany pin nie jest wlaczony to wlacz
    {
      digitalWrite(Pin4,HIGH);
      readData = "";
      TimePin4 = millis();
      Pin4On = true;
    }
  }

  //===============================
  CurrentTime=millis();
  
  if(Pin2On && CurrentTime-TimePin2>=TimeOnMillis2)
  {
    digitalWrite(Pin2,LOW);
    Pin2On = false;
  }
  
  if(Pin3On && CurrentTime-TimePin3>=TimeOnMillis3)
  {
    digitalWrite(Pin3,LOW);
    Pin3On = false;
  }
  
  if(Pin4On && CurrentTime-TimePin4>=TimeOnMillis4)
  {
    digitalWrite(Pin4,LOW);
    Pin4On = false;
  }
}
