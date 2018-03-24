//Written By Souvik Das 07/02/18
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const app = express();
var request = require("request");
var fs = require("fs");

const download2 = require('download');

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

var set_attributes = {};
var responseObject = {};
var responseText = {};
var googleText = "";

//Your Google API Key
var googleApiKey = "AIzaSyDZ5rIF_as0p3eJW08nKkQE2c0EFdmpG1w";

//Smarty Streets AuthId
var smartyStreetsAuthId = "eff0b523-c528-0292-6685-6ad2c5a6e92a";

//Smarty Streets Auth Token
var smartyStreetsAuthToken = "V7pWleHG8yLUS8CC7NqQ";

//Default Api
app.get('/', (req, res) => {
    res.send({
        "Status": "Welcome.. API up & running"
    });
});


// Main Api
app.post('/getVinDetails', (req, res) => {

  var imgName = "/dist/card.jpg";

  function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}




  var options2={
      rejectUnauthorized: false
  }

  download2(req.body.imgurl,options2).then(data => {

    fs.writeFileSync('dist/card.jpg', data);

  //fs.writeFileSync('dist/card.jpg', data);


  //var base64str = base64_encode(__dirname + imgName);
    var imageurl = req.body.imgurl;
    var tst=fs.createReadStream(__dirname + imgName);
    //console.log(tst);

    var options = {
        method: 'POST',
        url: 'https://vision.googleapis.com/v1/images:annotate',
        qs: {
            key: googleApiKey
        },
        headers: {
            'postman-token': 'a728d8a5-472a-e211-42b1-95c9a2cd3c91',
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        body: {
            requests: [{
                image: {
                    // source: {
                    //     imageUri: imageurl
                    // }
                    //content:fs.createReadStream('dist/card.jpg')
                    content:base64_encode(__dirname + imgName)
                },
                features: [{
                    type: 'TEXT_DETECTION',
                    maxResults: 1
                }]
            }]
        },
        json: true
    };

    request(options, function(error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        googleText = body.responses[0].textAnnotations[0].description;
           console.log(googleText);
        var pattern = /[a-zA-Z0-9]{9}[a-zA-Z0-9-]{2}[0-9]{6}/g;
var match = pattern.exec(googleText);
        
        if(match==null)
        {
            res.send({
       "Status": "Unable To Find VIN No"
   });
        }
else{
var start = match.index;
var text = match[0];
var end = start + text.length;

var options = { method: 'GET',
  url: 'http://specifications.vinaudit.com/getspecifications.php',
  qs: { vin: match[0], key: 'VA_DEMO_KEY', format: 'json' },
  headers: 
   { 'postman-token': 'b5a521c0-ee33-00e0-b6c9-63e84c7c8bfa',
     'cache-control': 'no-cache' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);
  responseText = JSON.parse(body);
  console.log(responseText.success);
  if(responseText.success=="false")
            {
                console.log("Failed.. Not VIN");
                res.send({"Status": "Failed.. Unable to classify VINss"});
            }
            else{


                //console.log(responseText.addresses[0].api_output[0].delivery_line_1);
                set_attributes.VehVin = match[0];
    
                responseObject.set_attributes = set_attributes;
                console.log("Done....");
                res.send(responseObject);
              }
});

}
        
        
    });


})
.catch((err) => {
    //console.log(err);
   res.send({
       "Status": "Unable To Download Image"
   });
});
})


//Get port from environment and store in Express.
const port = process.env.PORT || '3009';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));
