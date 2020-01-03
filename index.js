
//https://raw.githubusercontent.com/saranshbht/Project/master/Marks/Semester/16/570/015.csv
var obj = new URL(location.href).searchParams;
var file = obj.get("type") + "/" + sessionStorage.getItem("mode") + "/" + obj.get("admissionsOf") + "/" + obj.get("course") + "/" + obj.get("college") + ".csv";
console.log(file);
Papa.parse("https://raw.githubusercontent.com/saranshbht/Project/master/" + file, {
    download: true,
    complete: function(results) {
        // console.log(results);
        // console.log(results)
        // // console.log("hello");
        // var arr = results.data.slice(1);
        // arr.sort((a, b) => parseInt(b[9]) - parseInt(a[9]));
        // console.log(arr);
        // var headerRow = results.data[0];
        // var table = document.getElementById("table");
        // tablecontent = "<thead><tr>";
        // for(let i = 0; i < headerRow.length; i++){
        //     tablecontent += "<th class='align-middle sticky-header'><i class='fas fa-sort-asc' style='color:black'></i>" + headerRow[i] + "</th>";
        // }
        // tablecontent += "</tr></thead>";
        // for(var i = 0; i < results.data.length - 1; i++){
        //     tablecontent += "<tbody><tr>";
        //     for(var j = 0; j < headerRow.length; j++){
        //         tablecontent += "<td class='align-middle'>" + arr[i][j] + "</td>";
        //     }
        //     tablecontent += "</tr></tbody>";
        // }
        // table.innerHTML += tablecontent;
        // $("th:first-child").addClass("h");
        // $("tr td:first-child").addClass("h");



        var table = document.getElementById("table");
        var tablecontent = "<thead class='thead-dark'><tr>";
        var headerRow = results.data[0];
        for(let i = 0; i < headerRow.length; i++){
            tablecontent += `<th class='align-middle sticky-header' data-field='${headerRow[i]}' data-sortable="true" data-sorter="sorter">${headerRow[i]}</th>`;
        }
        tablecontent += "</tr></thead>";
        // console.log(tablecontent);
        table.innerHTML += tablecontent;
        $("tr th:last-child").attr("data-formatter", "valueFormatter");
        $("tr td:first-child").addClass("h");
        $("th:first-child").addClass("h");
        var keys = results.data.shift();
        var objects = results.data.map(function(values) {
            return keys.reduce(function(o, k, i) {
                o[k] = values[i];
                return o;
            }, {});        
        });
        // objects = JSON.stringify(objects.slice(50));
        // console.log(objects);
        // // bootstrapTable()
        // $("table").bootstrapTable();
        $("#table").bootstrapTable({
            data: objects,
            // stickyHeader: true,
            // stickyHeaderOffsetLeft: '0',
            // stickyHeaderOffsetRight: '0',
        });
        $("#table").bootstrapTable('remove', {
            field: 'RollNo',
            values: ''
        });
        // var lastScrollLeft = 0;
        // // $(".fixed-table-body").scroll(function(e) {
        // //     console.log('scroll event');
        // //   })
        // $(".fixed-table-body").scroll(function() {
        //     // console.log("hello");
        //     var documentScrollLeft = $(".fixed-table-body").scrollLeft();
        //     if(documentScrollLeft == 0){
        //         // console.log("hello");
        //         $(".h").attr("style", "");
        //         // $("#table").bootstrapTable('refreshOptions', {
        //         //     sortable: true,
        //         // });
        //     }
        //     else if (lastScrollLeft == 0) {
        //         console.log("hi");
        //         $(".h").attr("style", "display:table-cell;position:fixed;z-index:auto;background:aliceblue;overflow:hidden;height:inherit;width:inherit;")
        //         $("#table").bootstrapTable('refreshOptions', {
        //             sortable: false,
        //         });
        //         // console.log("hello");
        //     } 
        //     lastScrollLeft = documentScrollLeft;  
        // });
    },
    error: function(err, file){ alert("No such records"); history.back();}
});

function valueFormatter(value){
    return parseFloat(value).toFixed(3);
}

function sorter(a, b){
    floatA = parseFloat(a);
    floatB = parseFloat(b);
    if(isNaN(floatA) && isNaN(floatB))
        return a <= b ? -1 : 1;
    if(isNaN(floatA) || isNaN(floatB))
        return a.length <= b.length ? -1 : 1;
    return floatA - floatB;
    // return parseFloat(a) - parseFloat(b);
}