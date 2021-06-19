const req = require("./requirements");

const cookie_url =
  "http://durslt.du.ac.in/DURSLT_ND2020/Students/Combine_GradeCard.aspx";
const declared_url =
  "http://durslt.du.ac.in/DURSLT_ND2020/Students/List_Of_Declared_Results.aspx";
const grade_url =
  "http://durslt.du.ac.in/DURSLT_ND2020/Students/Combine_GradeCardReport_CBCS.aspx";
const marks_url =
  "http://durslt.du.ac.in/DURSLT_ND2020/Students/OLD_Sys1_GradeCardReport_Sem_New.aspx";

type = process.argv[2];
let url = type == "Marks" ? marks_url : grade_url;
let step = 10;
let source = "html";
let store = "json";

console.log(new Date().toISOString());
console.log(type);

req.loadFiles(type);
Promise.all([
  req.getRemaining(declared_url, type),
  req.setCookie(cookie_url),
]).then(async ([remaining]) => {
  console.log(remaining);
  remaining = remaining["18"];
  // console.log("downloading");
  await req.downloadHtmls(remaining, type, url, step, source);
  let to_be_updated = req.toBeUpdated();
  console.log(to_be_updated);
  // // console.log('making jsons');
  req.makeJsons(to_be_updated, type, source, store);
  // // console.log('making json-gzips');
  req.jsonsToJsonGzips(to_be_updated, type, store);
  // // console.log('making csvs');
  req.jsonsToCsvs(to_be_updated, type, store);
});
