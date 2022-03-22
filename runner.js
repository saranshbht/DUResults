const req = require("./requirements");

const links = {
  nov_dec: {
    cookie_url:
      "http://durslt.du.ac.in/DURSLT_ND2021/Students/Combine_GradeCard.aspx",
    declared_url:
      "http://durslt.du.ac.in/DURSLT_ND2021/Students/List_Of_Declared_Results.aspx",
    grade_url:
      "http://durslt.du.ac.in/DURSLT_ND2021/Students/Combine_GradeCardReport_CBCS.aspx",
    marks_url:
      "http://durslt.du.ac.in/DURSLT_ND2021/Students/OLD_Sys1_GradeCardReport_Sem_New.aspx",
  },
  may_june: {
    cookie_url:
      "http://durslt.du.ac.in/DURSLT_MJ2021/Students/Combine_GradeCard.aspx",
    declared_url:
      "http://durslt.du.ac.in/DURSLT_MJ2021/Students/List_Of_Declared_Results.aspx",
    grade_url:
      "http://durslt.du.ac.in/DURSLT_MJ2021/Students/Combine_GradeCardReport_CBCS.aspx",
    marks_url:
      "http://durslt.du.ac.in/DURSLT_MJ2021/Students/OLD_Sys1_GradeCardReport_Sem_New.aspx",
  },
};

type = process.argv[2];
let step = 10;
let source = "html";
let store = "json";

console.log(new Date().toISOString());

(async function () {
  for ([
    session,
    { cookie_url, declared_url, grade_url, marks_url },
  ] of Object.entries(links)) {
    req.setSession(session);
    console.log(session);
    console.log(type);

    req.loadFiles(type);

    let url = type == "Marks" ? marks_url : grade_url;
    await Promise.all([
      req.getRemaining(declared_url),
      req.setCookie(cookie_url),
    ]).then(async ([remaining]) => {
      console.log("Courses to be downloaded");
      console.log(JSON.stringify(remaining));
      // downloading the new/remaining courses
      await req.downloadHtmls(remaining, type, url, step, source);

      let to_be_updated = req.toBeUpdated();
      console.log("Courses to be updated");
      console.log(JSON.stringify(to_be_updated));

      // making jsons
      req.makeJsons(to_be_updated, type, source, store);
      // making json-gzips
      req.jsonsToJsonGzips(to_be_updated, type, store);
      // making csvs
      req.jsonsToCsvs(to_be_updated, type, store);
    });
  }
})();
