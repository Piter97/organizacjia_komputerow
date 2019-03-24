var http = require('http');
var fs = require('fs');
var socket = require('socket.io');
var serialport = require('serialport');
const portName = '/dev/ttyAMA0';

//konfiguracja połączania RPI3-ARDUINO, UART
const myPort = new serialport(portName,
{
	baudRate: 9600,
	dataBits: 8,
	parity: 'none',
	stopBits: 1
});

//funkcja odpowiadajaca za wyswietlenie komunikatu w konsoli o połączeniu z arduino
myPort.on("open", function(){
	console.log("Connected to Arduino Uno");
});

//tworzenie obiektu "server'
var server = http.createServer(function(req, res)
{
    fs.readFile('./index.html', 'utf-8', function(error, content)
	{
        	res.writeHead(200), {"Content-Type": "text/html"};
        	res.end(content);
    	});
});

var ClientH = [];
var ClientM = [];
var ClientT = [];
var timeCounter = 0;

//path to the file
var path = 'data.txt';

//server ustawiony na port 8080
server.listen(8080);

//Loading socket.io
var io = socket.listen(server);

//---------------------Client connection to the server---------------------
io.on('connection', function (socket)
{
	//client is connected
   	console.log('Connected to the client');
	//----------------------------------TXT -> WEBSITE---------------------------------------
	ReadFromFile(path, socket);

	//---------------------------------------------------------------------------------------
	var today = new Date();
	var hour = today.getHours();
	var minute = today.getMinutes();
	var seconds = today.getSeconds();

	if (hour < 10 && minute < 10)
	{
		console.log('Connection time: ' + '0' + hour + ":" + '0' + minute);
	}
	else if (hour > 10 && minute < 10)
	{
		console.log('Connection time: ' + hour + ":" + '0' + minute);
	}
	else if (hour < 10 && minute > 10)
	{
		console.log('Connection time: ' + '0' + hour + ":" + minute);
	}
	else
	{
		console.log('Connection time: ' + hour + ":" + minute);
	}

	//------------------------------------------------------------------------------------------------
    //Jeżeli użytkownik ustawi błędną godzinę to wyświetla się kounikat
	socket.on('errorTime', function()
	{
		console.log('User set wrong time');
	});

	console.log('Waiting for data...');

	//funkcja odpowiadająca za odbieranie sygnału "send" od klienta 
	socket.on('send',function(txt)
	{
		WriteToFile(path, txt);	//"HH:MM,T;"

		var date = new Date();
		var hour = date.getHours();
		var minute = date.getMinutes();
		var seconds = date.getSeconds();
		var j = 0;
		var h = "";
		var m = "";
		var t = "";
		var flagH = true;
		var flagM = false;

		for(i=0;i<txt.length;i++)
		{
			if(flagH == true && flagM == false)
			{
				if(txt.charAt(i) != ':')
				{
					h = h + txt.charAt(i);
					ClientH[j] = h;
				}
				else
				{
					flagH = false;
					flagM = true;
					h="";
					i++;
				}
			}
			if(flagH == false && flagM == true)
			{
				if(txt.charAt(i) != ',')
				{
					m = m + txt.charAt(i);
					ClientM[j] = m;
				}
				else
				{
					flagM = false;
					m="";
					i++;
				}
			}
			if(flagH == false && flagM == false)
			{
				if(txt.charAt(i) != ';')
				{
					t = t + txt.charAt(i);
					ClientT[j] = t;
				}
				else
				{
					flagH = true;
					t="";
					j++;
				}
			}
		}
	});
});

//3 sekundy interwał
setInterval(MyTimer, 3000);

//==================================FUNKCJE=====================================================

//funkcja, która wczytuje dane z pliku *.txt
function ReadFromFile(path, socket)
{
	var readContent = "";
	var time = "";
	var type = "";
	var j = 0;
	var flagH = true;
	var flagT = false;
    //HH:MM,T
    var buf = [];

	//metoda odpowiadająca za pobieranie oraz odpowiednie modyfikowanie danych z pliku *.txt
	fs.readFile(path, function read(err, data)
	{
		if(err)
    			return console.log(err);
		readContent = data.toString();

		for(i = 0; i < readContent.length; i++)
		{
			if(flagH == true && flagT == false)
			{
				if(readContent.charAt(i) != ',')
				{
					time = time + readContent.charAt(i);
					buf[j] = time;
				}
				else
				{
					flagH = false;
					flagT = true;
					i++;
					j++;
				}
			}
			if(flagH == false && flagT == true)
			{
				if(readContent.charAt(i) != ';')
				{
					type = type + readContent.charAt(i);
					buf[j] = type;
				}
				else
				{
					flagH = true;
					flagT = false;
					time = "";
					type = "";
					j++;
				}
			}
		}
		//wysłanie do klienta zmodyfikowanych danych
		socket.emit('fromFile', buf);
	});
}

//zapisanie danych do pliku *.txt
function WriteToFile(path, data)
{
	fs.writeFile(path, data, function(err)
	{
		if(err)
			return console.log(err);
		console.log("Successful write to file: " + path);
	});
}

//funkcja która wywoływana jest co 3 sekundy (setTimeInterval). Odpowiadaza sprawdzanie czy ustawiona godzina jest mniejsza od obecnej godziny o 5 minut. Jeżeli tak to //ustawiany jest delay - (setTimeout)
function MyTimer()
{
	var date = new Date();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var seconds = date.getSeconds();
	var wakeUpInMSeconds = 0;
	var buf = [];

//przelatuje po wszystkich elementach tablicy
	for(i = 0; i < ClientH.length; i++)
	{
		//poniżej 1 minuty
		if((parseInt(ClientH[i],10)*60+parseInt(ClientM[i],10)) - (hour*60+minute) <= 1 && (parseInt(ClientH[i],10)*60+parseInt(ClientM[i],10)) - (hour*60+minute) > 0) 
		{
			var client_hour = ClientH[i];
			var client_minute = ClientM[i];
			var client_type = ClientT[i];
			//usuwanie danego elementu z tablicy 
			ClientH.splice(i,1);
			ClientM.splice(i,1);
			ClientT.splice(i,1);
			//--------------------------------PRESCALING DATA TO SECONDS----------------------------------
			if (client_hour >= hour && client_minute > minute)
			{
				wakeUpInMSeconds = (client_hour * 3600 + client_minute * 60) - (hour * 3600 + minute * 60 + seconds);
			}
			else if (client_hour > hour && client_minute < minute)
			{
				wakeUpInmSeconds[timeCounter] = ((client_hour * 3600) + (client_minute * 60)) - ((hour * 3600) + (minute * 60) + seconds);
			}
			else if (client_hour == hour && client_minute < minute)
			{
				wakeUpInMSeconds = (24 * 3600) - ((hour * 3600 + minute * 60) - (client_hour * 3600 + client_minute * 60));
			}
			else if (client_hour > hour && client_minute == minute)
			{
				wakeUpInMSeconds = ((client_hour * 3600) + (client_minute * 60)) - ((hour * 3600) + (minute * 60) + seconds);
			}
			else if(client_hour < hour && client_minute <= minute)
			{
				wakeUpInMSeconds = ((24 * 3600) - (hour * 3600 + minute * 60 + seconds)) + (client_hour * 3600 + client_minute * 60);
			}
			else if(client_hour < hour && client_minute >= minute)
			{
				wakeUpInMSeconds = (24 * 3600) - (hour * 3600 + minute * 60 + seconds) + (client_hour * 3600 + client_minute * 60);
			}
			else if(client_hour == hour && client_minute == minute)
			{
				wakeUpInMSeconds = 0;
			}

			//jezei liczba sekund jest mniejsza od 5 minut
			if(wakeUpInSeconds < (5*60))
			{
				//wysyałnie odpowiednich sygnałów sterujących w zależności od ustawionego typu (b,s1,s2)
				setTimeout(function()
				{
					if(client_type == 'b')
					{
						myPort.write('11');
					}
					if(client_type == 's1')
					{
                                                myPort.write('10');
					}
					if(client_type == 's2')
					{
                                                myPort.write('01');
					}
				}, wakeUpInMSeconds*1000); //liczba sekund
				var txt = "";
				//ustawienie odpowiedniego stringa do plikut z tablicy godzin, które pozostały
				for(i=0;i<ClientH.length;i++)
				{
					txt = txt + ClientH[i]+":"+ClientM[i]+","+ClientT[i]+";";
				}
				//zapisanie do pliku
				WriteToFile(path, txt);
			}
			timeCounter++;
		}
	}
}

