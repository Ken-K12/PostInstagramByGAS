function createDate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フィード投稿');
  let lastRow = sheet.getLastRow();
  for(i=10; i<=31; i++){
    console.log(lastRow)
    // sheet.getRange(`B${lastRow+1}`).setValue(`2024010${i}`);
    sheet.getRange(`B${lastRow+1}`).setValue(`202403${i}`);
    sheet.getRange(`A${lastRow+1}`).insertCheckboxes();
    lastRow +=1;
  }
}
