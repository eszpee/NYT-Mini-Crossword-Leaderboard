const CONSTSHEET = 'CONST';
const LOGSHEET = 'log';

function updateLeaderboards() {
  const leaderboards = getLatestStandings();
  sheet = getSheetWithName(LOGSHEET);

  //get latest date from sheet
  const sheetDate = new Date(sheet.getRange(sheet.getLastRow(),1).getValue());
  const siteDate = new Date(leaderboards['_date']);
  delete (leaderboards['_date']);
  if (sheetDate.getDate() != siteDate.getDate()) {
    //if ours is different, start a new line
    sheet.getRange(sheet.getLastRow()+1,1).setValue(siteDate);
  }
  
  //iterate over names from sheet, remove what's done
  for (let col = 2; col <= sheet.getLastColumn(); col++) {
    const name = sheet.getRange(1,col).getValue();
    if (leaderboards[name] !== undefined) {
      sheet.getRange(sheet.getLastRow(),col).setValue(leaderboards[name]);
      delete leaderboards[name];
    }
  }

  //let's see if we have someone new
  for (const name in leaderboards) {
    sheet.getRange(1,sheet.getLastColumn()+1).setValue(name);
    sheet.getRange(sheet.getLastRow(),sheet.getLastColumn()).setValue(leaderboards[name]);
  }
  
}

function getLatestStandings() {
  const page = getLeaderboardPage();
  var results = [];

  //get date
  const matchDate = new RegExp('<h3 class="lbd-type__date">(.*?)<\\/h3>','i');
  if (matchDate.test(page)) {
    const words = page.match(matchDate)[1].split(', ');
    const date = words[1]+', '+words[2];
    //Logger.log(date);
    results['_date'] = date;
  }
  
  //get results
  const matchRows = new RegExp('<div class="lbd-score">(.*?)<\\/div>','gi');
  if (matchRows.test(page)) {
    page.match(matchRows).forEach(function(row) {
      //Logger.log(row);
      const mRow = new RegExp('<p class="lbd-score__name">(.*?) <\\/p><p class="lbd-score__time">(.*?)<\\/p>','i')
      if(mRow.test(row)) {
        const items = row.match(mRow);
        //Logger.log(items[1]+items[2]);
        results[items[1]] = timeToSec(items[2]);
      }
    });
  }
  return results;
}

function getLeaderboardPage() {
  const cookie = 'NYT-S='+getSheetWithName(CONSTSHEET).getRange(1,2).getValue();
  var options = {
    "headers": {'cookie': cookie},
    "muteHttpExceptions": true,
  };
  const response = UrlFetchApp.fetch("https://www.nytimes.com/puzzles/leaderboards",options);
  return response.getContentText();
}

function timeToSec(str) {
  var sec = 0;
  const nums = str.split(':');
  if (nums === str) {
    sec = parseInt(str,10);
  }
  else {
    sec = parseInt(nums[0],10)*60 + parseInt(nums[1],10);
  }
  return sec;
}

function getSheetWithName(name) {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (const idx in sheets) {
    if (sheets[idx].getName() == name) {
      return sheets[idx];
    }
  }
  return null;
}
