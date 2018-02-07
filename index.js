const request = require('request');
const R = require('ramda');
const Table = require('cli-table');
const parseString = require('xml2js').parseString;

const ids = require('./ids');
const conf = require('./conf');

const BASE_URL = 'https://api.viessmann.io/vitotrol/soap/v1.0/iPhoneWebService.asmx?WSDL';

const DEFAULT_OPTIONS = {
  url    : BASE_URL,
  jar    : true, // enable cookies
  headers: {
    'Accept'         : '*/*',
    'Content-Type'   : 'text/xml; charset=utf-8',
    'Accept-Language': 'en-us',
    'User-Agent'     : 'Vitotrol%20Plus/155 CFNetwork/897.10 Darwin/17.5.0'
  }
};

function sendRequest(action, data) {
  return new Promise(function (resolve, reject) {
    const options = R.mergeDeepLeft(DEFAULT_OPTIONS, {
      body   : data,
      headers: {
        'SOAPAction': action
      }
    });
    request.post(options, function (error, response, body) {
      if (error) {
        return reject(error);
      }

      if (response.statusCode !== 200) {
        return reject(response.statusMessage);
      }

      return parseString(body, {explicitArray: false}, function (error, result) {
        if (error) {
          return reject(error);
        }
        const bodyLens = R.lensPath(['soap:Envelope', 'soap:Body']);

        return resolve(R.view(bodyLens, result));
      });
    });
  });
}

function login(email, password) {
  const data = `<?xml version="1.0" encoding="UTF-8" ?>
  <soap:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.e-controlnet.de/services/vii/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
  <Login>
  <AppVersion><![CDATA[2.3.4]]></AppVersion>
  <Betriebssystem><![CDATA[iOS]]></Betriebssystem>
  <Benutzer><![CDATA[${email}]]></Benutzer>
  <AppId><![CDATA[prod]]></AppId>
  <Passwort><![CDATA[${password}]]></Passwort>
  </Login>
  </soap:Body>
  </soap:Envelope>`;
  return sendRequest('http://www.e-controlnet.de/services/vii/Login', data);
}

function getTypeInfo(systemid, deviceid) {
  const data = `<?xml version="1.0" encoding="UTF-8" ?>
  <soap:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.e-controlnet.de/services/vii/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
  <GetTypeInfo>
  <AnlageId><![CDATA[${systemid}]]></AnlageId>
  <GeraetId><![CDATA[${deviceid}]]></GeraetId>
  </GetTypeInfo>
  </soap:Body>
  </soap:Envelope>`;
  return sendRequest('http://www.e-controlnet.de/services/vii/GetTypeInfo', data);
}

function getData(systemid, deviceid, dataIds) {
  const dataIdEntries = R.map(id => {
    return `<int><![CDATA[${id}]]></int>`;
  }, dataIds).join('\n');

  const data = `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns="http://www.e-controlnet.de/services/vii/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
  <GetData>
      <AnlageId><![CDATA[${systemid}]]></AnlageId>
      <GeraetId><![CDATA[${deviceid}]]></GeraetId>
      <DatenpunktIds>
        ${dataIdEntries}
      </DatenpunktIds>
      <UseCache><![CDATA[false]]></UseCache>
    </GetData>
  </soap:Body>
</soap:Envelope>`;
  // console.log(data);
  return sendRequest('http://www.e-controlnet.de/services/vii/GetData', data);
}

function printTable(data) {
  const table = new Table({
    head: conf.fields
  });

  R.forEach(e => table.push(R.props(conf.fields, e)), data);

  console.log(table.toString());
}

login(conf.email, conf.password).then(loginResponse => {
  const loginResultLens = R.lensPath(['LoginResponse', 'LoginResult', 'Ergebnis']);
  const loginResultTextLens = R.lensPath(['LoginResponse', 'LoginResult', 'ErgebnisText']);
  if (R.view(loginResultLens, loginResponse) !== '0') {
    return console.log(R.view(loginResultTextLens, loginResponse));
  }

  getTypeInfo(conf.systemId, conf.deviceId).then(typeInfoResponse => {
    const dataPointListLens = R.lensPath(['GetTypeInfoResponse', 'GetTypeInfoResult', 'TypeInfoListe', 'DatenpunktTypInfo']);
    const dataPointList = R.view(dataPointListLens, typeInfoResponse);

    getData(conf.systemId, conf.deviceId, ids).then(dataResponse => {
      const valueListLens = R.lensPath(['GetDataResponse', 'GetDataResult', 'DatenwerteListe', 'WerteListe']);
      const valueList = R.view(valueListLens, dataResponse);

      const mappedValues = R.map(value => {
        const definition = R.find(R.propEq('DatenpunktId', value.DatenpunktId), dataPointList);
        return R.mergeDeepLeft(definition, value);
      }, valueList);

      printTable(mappedValues);
    }).catch(error => {
      console.log(error);
    });
  }).catch(error => {
    console.log(error);
  });
}).catch(error => {
  console.log(error);
});
