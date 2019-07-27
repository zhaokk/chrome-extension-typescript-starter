import * as $ from "jquery";
const { Parser } = require("json2csv");


class Variation {
  constructor(name: string) {
    this.count = 1;
    this.name = name;
  }
  name: string;
  count: number;
}

class ScrapResponse {
  constructor(name: string) {
    this.productName = name;
    this.varaitionsAndCount = [];
  }
  varaitionsAndCount: Array<Variation>;
  productName: string;
}

function downloadCSV(csv:any,filename:string) {  
    var data, link;
    if (csv == null) return;

    filename = filename || 'export.csv';

    if (!csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    data = encodeURI(csv);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
}

function getObjFields(obj: any): Array<string> {
  let fields = [];
  Object.keys(obj).forEach(key => fields.push(key));
  return fields;
}

function convertAndDownload(response: ScrapResponse) {
    var fields = getObjFields(response.varaitionsAndCount[0]);
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(response.varaitionsAndCount);
    downloadCSV(csv,response.productName+".csv");
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.color) {
    console.log("Receive color = " + msg.color);
    document.body.style.backgroundColor = msg.color;
    sendResponse("Change color to " + msg.color);
  }

  if (msg.getPageContent) {
    let itemName = $($(".BHitemDesc")[0]).text();
    let scrapResponse = new ScrapResponse(itemName);
    let varaitions = $(".variationContentValueFont");
    varaitions.map((index, element) => {
      let varCombinName = $(element).text();
      let soldRecord = new Variation(varCombinName);
      let vars = $(element).html();
      let varArray = vars.split("<br>");
      varArray.pop();
      varArray.map((value, i) => {
        let varationName = value.split(":")[0];
        let varationValue = $(value.split(":")[1]).text();
        soldRecord[varationName] = varationValue;
      });
      let record = scrapResponse.varaitionsAndCount.find(e => {
        return e.name === varCombinName;
      });
      if (record) {
        record.count++;
      } else {
        scrapResponse.varaitionsAndCount.push(soldRecord);
      }
    });
    console.log(scrapResponse);
    convertAndDownload(scrapResponse);
    sendResponse(scrapResponse);
  }
});
