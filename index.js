
//https://raw.githubusercontent.com/saranshbht/Project/master/Marks/Semester/16/570/015.csv
var obj = new URL(location.href).searchParams;
var file = obj.get("type") + "/" + obj.get("mode") + "/" + obj.get("admissionsOf") + "/" + obj.get("course") + "/" + obj.get("college") + ".csv";
var baseUrl = "https://raw.githubusercontent.com/saranshbht/Project/master/";
// console.log(file);
Papa.parse(baseUrl + file, {
    download: true,
    complete: function(results) {
        // console.log(JSON.stringify(results.data));
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
        // var tablecontent = "<thead class='thead-dark'><tr>";
        var headerRow = results.data[0];
        // for(let i = 0; i < headerRow.length; i++){
        //     tablecontent += `<th class='align-middle' data-field='${headerRow[i]}' data-sortable="true" data-sorter="sorter">${headerRow[i]}</th>`;
        // }
        var columnData = [];
        for(let i = 0; i < headerRow.length; i++){
            columnData.push({title: headerRow[i], render: valueFormatter});
        }
        // columnData[columnData.length - 1].render = valueFormatter;
        // console.log(columnData);
        // tablecontent += "</tr></thead>";
        // // console.log(tablecontent);
        // table.innerHTML += tablecontent;
        // $("tr th:last-child").attr("data-formatter", "valueFormatter");
        // $("tr td:first-child").addClass("h");
        // $("th:first-child").addClass("h");
        // var keys = results.data.shift();
        // var objects = results.data.map(function(values) {
        //     return keys.reduce(function(o, k, i) {
        //         o[k] = values[i];
        //         return o;
        //     }, {});        
        // });
        results.data.pop();
        $("#table").DataTable({
            data: results.data.slice(1),
            columns: columnData,
            fixedHeader : true,
            scrollX: true,
            scrollY: 500,
            scrollCollapse: true,
            fixedColumns: true,
            dom: 'lfrtipB',
            buttons: [
                'print',
            ]
            // responsive: true,
            // scrollX: true
            // stickyHeaderOffsetLeft: '0',
            // stickyHeaderOffsetRight: '0',
        });
        
        // $("#table").bootstrapTable('remove', {
        //     field: 'RollNo',
        //     values: ''
        // });
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
    error: function(err, file){ 
        $("#noRecord").modal('show');
        $('#noRecord').on('hidden.bs.modal', function() {
            history.back();
        });
        
    }
});
// var offset = 3;
// // console.log('hello');

// var table = $('#table').DataTable();
// console.log(table.columns([0]).values);
// $('#table > tbody > tr').each(function () {
//     console.log('Hello World');
//     var values = [];

//     $(this).children('td').each(function (i,v) {
//         if (i < offset) return;
//         var value = parseInt($(this).text());
//         if(!isNaN(value))
//             values.push(value);
//     });

//     var maxValue = Math.max.apply(null, values);
//     var minValue = Math.min.apply(null, values);
//     console.log(maxValue);
//     $(this).children('td').each(function () {
//         if ($(this).text() == maxValue.toString()) {
//             $(this).addClass('max');
//         }

//         if ($(this).text() == minValue.toString()) {
//             $(this).addClass('min');
//         }
//     });

// });

function valueFormatter(value){
    if(!value || isNaN(value))
        return value;
    if(value && value % 1 === 0)
        return Math.abs(value);
    if(value)
        return parseFloat(value).toFixed(3);
}

// function sorter(a, b){
//     floatA = parseFloat(a);
//     floatB = parseFloat(b);
//     if(isNaN(floatA) && isNaN(floatB))
//         return a <= b ? -1 : 1;
//     if(isNaN(floatA) || isNaN(floatB))
//         return a.length <= b.length ? -1 : 1;
//     return floatA - floatB;
//     // return parseFloat(a) - parseFloat(b);
// }