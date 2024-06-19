const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN");
const INSTAGRAM_BUSINESS_ACCOUNT = PropertiesService.getScriptProperties().getProperty("INSTAGRAM_BUSINESS_ACCOUNT");
const BASE_URL = "https://graph.facebook.com/v19.0";

function feedMediaPublish() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フィード投稿');
  let lastRow = sheet.getLastRow();
  console.log(`lastRow: ${lastRow}`);
  for(i=2; i<=lastRow; i++){
    console.log(sheet.getRange(`B${i}`).getValue());
    if(sheet.getRange(`B${i}`).getValue() == getToday() && !sheet.getRange(`A${i}`).getValue()){
      let mediaUrls = [];
      if(sheet.getRange(`E${i}`).getValue()){mediaUrls.push(sheet.getRange(`E${i}`).getValue())}else{console.error('You must enter an image URL.')}
      if(sheet.getRange(`F${i}`).getValue()){mediaUrls.push(sheet.getRange(`F${i}`).getValue())}
      if(sheet.getRange(`G${i}`).getValue()){mediaUrls.push(sheet.getRange(`G${i}`).getValue())}
      if(sheet.getRange(`H${i}`).getValue()){mediaUrls.push(sheet.getRange(`H${i}`).getValue())}
      if(sheet.getRange(`I${i}`).getValue()){mediaUrls.push(sheet.getRange(`I${i}`).getValue())}
      if(sheet.getRange(`J${i}`).getValue()){mediaUrls.push(sheet.getRange(`J${i}`).getValue())}
      if(sheet.getRange(`K${i}`).getValue()){mediaUrls.push(sheet.getRange(`K${i}`).getValue())}
      if(sheet.getRange(`L${i}`).getValue()){mediaUrls.push(sheet.getRange(`L${i}`).getValue())}
      if(sheet.getRange(`M${i}`).getValue()){mediaUrls.push(sheet.getRange(`M${i}`).getValue())}
      if(sheet.getRange(`N${i}`).getValue()){mediaUrls.push(sheet.getRange(`N${i}`).getValue())}

      mediaUrls = mediaUrls.filter(Boolean);
      console.log(`mediaUrls: ${mediaUrls}`);

      console.log('execute makeContainerAPI');
      containerIds = makeContainerAPI(mediaUrls,sheet, i);
      console.log(`containerIds: ${containerIds}`);
      console.log('execute makeGroupContainerAPI');
      containerGroupId = makeGroupContainerAPI(containerIds, sheet.getRange(`D${i}`).getValue());
      console.log(`containerGroupId: ${containerGroupId}`);
      console.log('execute contentPublishAPI');
      res = contentPublishAPI(containerGroupId);
      console.log(res);
      sheet.getRange(`A${i}`).check();
    }
  }
}

// ステップ①: 画像と動画を登録し、コンテナIDを画像と動画の分取得する
function makeContainerAPI(mediaUrls,sheet, i) {
  let containerIds = [];
  console.log(`mediaUrls: ${mediaUrls}`);

  mediaUrls.forEach(function(data, index){
    console.log(`index : ${index}`);
    console.log(`mediaurl.length: ${mediaUrls.length}`);
    let postData = {
      image_url: data,
      is_carousel_item: true
    }
    if(Number(mediaUrls.length) == index+1 && sheet.getRange(`O${i}`).getValue() == 'C'){
      console.log('タグつけます', index);
      // Todo : UserNameを任意のものに変更する
      postData.user_tags =  [{username: 'hogehoge', x:0.5, y:1.0}];
    }
      
    const url = `${BASE_URL}/${INSTAGRAM_BUSINESS_ACCOUNT}/media?`;
      console.log(`postdata: ${JSON.stringify(postData)}`);
    response = instagramApi(url, 'POST', postData);
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
        containerIds.push(response);
      } else {
        console.error('Instagram APIのリクエストでエラーが発生しました。');
        return null;
      }
    } catch (error) {
      console.error('Instagram APIのレスポンスの解析中にエラーが発生しました:', error);
      return null;
    }
  })

  return containerIds;

}

// ステップ②: ステップ①の複数コンテナIDをまとめて登録し、グループ化コンテナIDを取得する
function makeGroupContainerAPI(containerIds, caption) {

  const postData = {
    media_type: 'CAROUSEL',
    caption: caption,
    children: containerIds
  }

 // グループコンテナID取得
  const url = `${BASE_URL}/${INSTAGRAM_BUSINESS_ACCOUNT}/media?`;
  let response = instagramApi(url, 'POST', postData);
  response = JSON.parse(response)['id'];  
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
function contentPublishAPI(containerGroupId) {

  const postData = {
    media_type: 'CAROUSEL',
    creation_id: containerGroupId
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