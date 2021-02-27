const binanceConfig = {
  API_KEY: '',
  API_SECRET: '',
  HOST_URL: 'https://api3.binance.com',
};

function encodeURI(obj) { 
  var s = Object.keys(obj).map(function(key) { 
    return key + '=' + obj[key]; 
  }).join('&'); 
 return s
} 

function privateRequest(data, endPoint, type){
  dataQueryString = encodeURI(data)
  var signature = Utilities.computeHmacSha256Signature(dataQueryString, binanceConfig.API_SECRET);
  signature = signature.map(function(e) {
        var v = (e < 0 ? e + 256 : e).toString(16);
        return v.length == 1 ? "0" + v : v;
    }).join("");

  var url = binanceConfig.HOST_URL + endPoint + '?' + dataQueryString + '&signature=' + signature
  const requestConfig = {
    method: type,
    headers: {
      'X-MBX-APIKEY': binanceConfig.API_KEY,
    },
  };
  try {
    console.log('URL: ', url);
    var response = UrlFetchApp.fetch(url, requestConfig);
    return JSON.parse(response.getContentText());
  }
  catch (err) {
    console.log(err);
    return false
  }
};

const data = {
  type: 'SPOT',
  recvWindow: 20000,
  timestamp: Date.now(),
};

function getBinanceBtcEquivBalance(){
  var resp = privateRequest(data, '/sapi/v1/accountSnapshot', 'GET');
  console.log(resp);
  if (resp != false){
    var BTCBalance = resp.snapshotVos[0].data.totalAssetOfBtc;
    console.log(BTCBalance)
    return BTCBalance;
  }
}

