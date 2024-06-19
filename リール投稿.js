function reelMediaPublish() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('リール投稿');
  let lastRow = sheet.getLastRow();
  console.log(`lastRow: ${lastRow}`);
  for(i=2; i<=lastRow; i++){
    console.log(sheet.getRange(`B${i}`).getValue());
    if(sheet.getRange(`B${i}`).getValue() == getToday() && !sheet.getRange(`A${i}`).isBlank()){
      let reelURL = sheet.getRange(`E${i}`).getValue();
      console.log(reelURL);

      console.log('execute makeReelContainerAPI');
      let containerId = makeReelContainerAPI(reelURL);
      console.log(`containerIds: ${containerId}`);
      console.log('execute contentPublishAPI');
      res = contentPublishAPI(containerId);
      console.log(res);
      sheet.getRange(`A${i}`).check();
    }
  }
}

// ステップ①: 画像と動画を登録し、コンテナIDを画像と動画の分取得する
function makeReelContainerAPI(reelURL) {

    let postData = {
      video_url: reelURL,
      media_type: 'REELS'
    }
      
    const url = `${BASE_URL}/${INSTAGRAM_BUSINESS_ACCOUNT}/media?`;
    let response = instagramApi(url, 'POST', postData);
    response = JSON.parse(response)['id'];
    console.log(`response: ${response}`);

    statusCode = "IN_PROGRESS";
    while (statusCode != 'FINISHED'){
      console.log(`Status Code is ${statusCode}`);
      statusCode = getMediaStatus(response)["status_code"];
      Utilities.sleep(5000);
    }

    try {
      if (response) {
        return response;
      } else {
        console.error('Instagram APIのリクエストでエラーが発生しました。');
        return null;
      }
    } catch (error) {
      console.error('Instagram APIのレスポンスの解析中にエラーが発生しました:', error);
      return null;
    }

}

// ステップ③: ステップ②のグループ化コンテナIDをを使って投稿
function contentPublishAPI(containerId) {

  const postData = {
    media_type: 'REELS',
    creation_id: containerId
  }

  const url = `${BASE_URL}/${INSTAGRAM_BUSINESS_ACCOUNT}/media_publish?`;
  const response = instagramApi(url, 'POST', postData);

  try {
    if (response) {
      const data = JSON.parse(response.getContentText());
      return data;
    } else {
      console.error('Instagram APIのリクエストでエラーが発生しました。');
      return null;
    }
  } catch (error) {
    console.error('Instagram APIのレスポンスの解析中にエラーが発生しました:', error);
    return null;
  }
}

function getMediaStatus(containerId){
  // https://graph.facebook.com/v16.0/{ig-container-id}?fields=status_code
  const url = `${BASE_URL}/${containerId}?fields=status_code&access_token=${ACCESS_TOKEN}`;
  let response = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  return response;
}

// APIを叩く関数
function instagramApi(url, method,postData) {
  try {
    const data = postData
    const headers = {
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
      'Content-Type': 'application/json',
    };
    const options = {
      'method': method,
      'headers': headers,
      'payload': JSON.stringify(data),
      'muteHttpExceptions' : true,
      'validateHttpsCertificates' : false,
      'followRedirects' : false
    };

    const response = UrlFetchApp.fetch(url, options);
    console.log(response.getContentText());
    return response;
  } catch (error) {
    console.error('Instagram APIのリクエスト中にエラーが発生しました:', error);
    return null;
  }
}