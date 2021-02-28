const binanceConfig = {
  API_KEY: 'YuxEOr3T16OfSKeqkw3ShPJjKiNOLQs1rUeCovnuYsvLSwJqcSUNvdJgsc0QGpOB',
  API_SECRET: 'eD8LzvIvFFMNk766l8wyZR8cEOLNx798br6VXgsRZWg4EaVt9tZETyCCxcmSKAMk',
  HOST_URL: 'https://api3.binance.com',
};

function encodeURI(obj) { 
  var s = Object.keys(obj).map(function(key) { 
    return key + '=' + obj[key]; 
  }).join('&'); 
 return s
} 


function binanceRequest(data, endPoint, type, private = false){
  dataQueryString = encodeURI(data)

  if (private){
    var signature = Utilities.computeHmacSha256Signature(dataQueryString, binanceConfig.API_SECRET);
    signature = signature.map(function(e) {
        var v = (e < 0 ? e + 256 : e).toString(16);
        return v.length == 1 ? "0" + v : v;
    }).join("");

  var url = binanceConfig.HOST_URL + endPoint + '?' + dataQueryString + '&signature=' + signature;
  }
  else {
    var url = binanceConfig.HOST_URL + endPoint + '?' + dataQueryString
  }
  
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
    console.log("Request failed! Error:" + err);
    return false
  }
};

function getTotalBinanceBalanceInBTC(){
  var snapshotReqData = {
    type: 'SPOT',
    recvWindow: 20000,
    timestamp: Date.now(),
    limit: 5
  };

  var resp = binanceRequest(snapshotReqData, '/sapi/v1/accountSnapshot', 'GET', true);
  console.log(resp);
  if (resp != false){
    // Get all available funds
    var BTCBalance = parseFloat(resp.snapshotVos.slice(-1)[0].data.totalAssetOfBtc)
    
    // Now account for any locked funds (most likely in unfilled orders)
    var lockedFunds = {}
    var balances = resp.snapshotVos.slice(-1)[0].data.balances
    for (var i=0;i<balances.length-1;i++){
      var amountLocked = parseFloat(balances[i].locked)
      if (amountLocked > 0){
        var tickerName = balances[i].asset + 'BTC'
        lockedFunds[tickerName] = amountLocked
      }
    }

    // Fetch prices for each ticker
    var priceReqData = {
      symbol: ''
    };

    for (const [ticker, amount] of Object.entries(lockedFunds)) {
      priceReqData.symbol = ticker;
      var resp = binanceRequest(priceReqData, '/api/v3/avgPrice');
      BTCBalance += parseFloat(resp.price) * amount;
    }

    console.log(BTCBalance)
    return BTCBalance;
  }
}
