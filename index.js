function sorter(a, b) {
    var floatA = parseFloat(a);
    var floatB = parseFloat(b);
    if (isNaN(floatA) && isNaN(floatB))
        return a <= b ? -1 : 1;
    if (isNaN(floatA) || isNaN(floatB))
        return a.length <= b.length ? -1 : 1;
    return floatA <= floatB ? -1 : 1;
}

function valueFormatter(value, type = 'display') {
    if (type === 'display' || type === 'filter') {
        if (!value || isNaN(value))
            return value;
        return +(Math.round(value + "e+3") + "e-3");
    }
    var val = parseFloat(value);
    return (val ? val : value);
}

function addTooltip() {
    var table = $("#table").DataTable();
    var columns = table.settings().init().columns;

    $("#table tbody tr").each(function() {
        var tds = $('td', this);
        tds.slice(4).each(function() {
            column = columns[$(this).index()].name;
            this.setAttribute('data-toggle', 'tooltip');
            this.setAttribute('title', column);
        });
    });
    $('[data-toggle="tooltip"]').tooltip({ 'placement': 'right' });
}

function addMinMax() {
    var table = $("#table").DataTable();
    // console.log(table.columns());
    var count = -1;
    table.columns().every(function() {
        if (++count > 3) {
            var data = this.data();
            var sorted = data.sort(sorter);
            var maxVal = valueFormatter(sorted[sorted.length - 1]);
            var i = 0;
            while (!sorted[i++]);
            var minVal = valueFormatter(sorted[i - 1]);
            this.nodes().to$().each(function() {
                $(this).removeClass('max min');
                if (valueFormatter(this.innerHTML) === maxVal)
                    $(this).addClass('max');
                else if (valueFormatter(this.innerHTML) === minVal)
                    $(this).addClass('min');
            });
        }
    });
}

function preprocess(columns, data) {
    data.pop();
    var keys = []
    columns.forEach(e => keys.push(e.replace(/\./g, "")));

    var objects = data.map(function(values) {
        return keys.reduce(function(o, k, i) {
            o[k] = values[i] || "";
            return o;
        }, {});
    });

    return { keys: keys, data: objects };
}

//https://raw.githubusercontent.com/saranshbht/Project/master/Marks/Semester/16/570/015.csv
var obj = new URL(location.href).searchParams;
var path = obj.get("type") + "/" + obj.get("mode") + "/" + obj.get("admissionsOf") + "/" + obj.get("course") + "/";
var file = path + obj.get("college") + ".csv";
var baseUrl = "https://raw.githubusercontent.com/saranshbht/Project/master/";

$("select").select2({ theme: "classic", width: "100%" });

Papa.parse(baseUrl + 'codes/collegeCodes.csv', {
    download: true,
    complete: function(results) {
        collegeList = $("#college");
        results.data.shift();
        $.each(results.data, function(index, item) {
            collegeList.append(new Option(item[1], item[0]));
        });
    },
    error: function(err, file) {
        console.log("College List not loaded");
    }
});

Papa.parse(baseUrl + 'codes/courseCodes.csv', {
    download: true,
    complete: function(results) {
        courseList = $("#course");
        results.data.shift();
        $.each(results.data, function(index, item) {
            courseList.append(new Option(item[1], item[0]));
        });
    },
    error: function(err, file) {
        console.log("Course List not loaded");
    }
});

Papa.parse(baseUrl + file, {
    download: true,
    complete: function(results) {
        var val = new URL(location.href).searchParams.get("college");
        if (val == "allColleges")
            $("#addCollegeButton").prop('disabled', true);
        else
            collegeList.find('[value=' + val + ']').remove();
        var obj = preprocess(results.data.shift(), results.data);
        var keys = obj.keys;
        var objects = obj.data;

        var columnData = [{ title: '#', data: 'id', defaultContent: '', searchable: false, orderable: false, targets: 0 }];
        for (let i = 0; i < keys.length; i++) {
            columnData.push({ title: keys[i], name: keys[i], data: keys[i], render: valueFormatter });
        }
        var table = $("#table").DataTable({
            data: objects,
            columns: columnData,
            dom: 'frtp',
            order: [
                [1, 'asc']
            ],
            "pageLength": 50,
        });
        addTooltip();
        addMinMax();
        $('#table').wrap('<div class="dataTables_scroll" />');
        table.on('order.dt search.dt', function() {
            table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function(cell, i) {
                cell.innerHTML = i + 1;
            });
        }).draw();
        // var chart = Highcharts.chart('highcharts-div', {
        //     data: {
        //         table: 'table',
        //         startColumn: 2,
        //         endColumn: 4
        //     },
        //     chart: {
        //         type: 'column'
        //     },
        //     title: {
        //         text: 'Data extracted from a HTML table in the page'
        //     },
        //     // xAxis:{
        //     //     // categories: headerRow.slice(4)
        //     // },
        //     yAxis: {
        //         // allowDecimals: false,
        //         title: {
        //             text: 'Marks'
        //         }
        //     },
        //     tooltip: {
        //         // formatter: function () {
        //         //     return '<b>' + this.series.name + '</b><br/>' +
        //         //         this.point.y + ' ' + this.point.name.toLowerCase();
        //         // }
        //     }
        // series:[
        //     {
        //         name: results.data[9][0],
        //         data: results.data[9].slice(4).map(function(num){
        //             if(num)
        //                 return parseFloat(num);
        //             else
        //                 return null;
        //         })
        //     },
        //     {
        //         name: results.data[22][0],
        //         data: results.data[22].slice(4).map(function(num){
        //             if(num)
        //                 return parseFloat(num);
        //             else
        //                 return null;
        //         })
        //     }
        // ]
        // });
        // console.log(chart);
        // console.log(results.data[2].slice(4));
        // table.draw();
    },
    error: function(err, file) {
        $("#noRecord").modal('show');
        $('#noRecord').on('hidden.bs.modal', function() {
            history.back();
        });

    }
});

$("#addCollegeButton").click(function() {
    var e = $("#college").val();
    var file1 = path + e + '.csv';
    Papa.parse(baseUrl + file1, {
        download: true,
        complete: function(results) {
            collegeList.find('[value=' + e + ']').remove();
            var obj = preprocess(results.data.shift(), results.data);
            var keys = obj.keys;
            var objects = obj.data;
            var table = $("#table").DataTable();
            var old_keys = [];
            var columns = table.settings().init().columns;
            table.columns().every(function(index) {
                old_keys.push(columns[index].name);
            });

            old_keys.shift();
            var headerRow = Array.from(new Set([...keys, ...old_keys]));

            var columnData = [{ title: '#', data: 'id', defaultContent: '', searchable: false, orderable: false, targets: 0 }];
            for (let i = 0; i < headerRow.length; i++) {
                columnData.push({ "title": headerRow[i], "name": headerRow[i], "data": headerRow[i], "render": valueFormatter });
            }

            old_data = table.rows().data().toArray();
            var old_objects = old_data.map(function(values) {
                return headerRow.reduce(function(o, k, i) {
                    o[k] = values[k] || "";
                    return o;
                }, {});
            });

            var objects = objects.map(function(values) {
                return headerRow.reduce(function(o, k, i) {
                    o[k] = values[k] || "";
                    return o;
                }, {});
            });

            table.destroy();
            $("#table").empty();
            var table = $("#table").DataTable({
                data: objects.concat(old_objects),
                columns: columnData,
                dom: 'frtp',
                "pageLength": 50,
                order: [
                    [1, 'asc']
                ],
            });
            addTooltip();
            addMinMax();
            $('#table').wrap('<div class="dataTables_scroll" />');
            table.on('order.dt search.dt', function() {
                table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function(cell, i) {
                    cell.innerHTML = i + 1;
                });
            }).draw();
            $(".toast").toast({ 'delay': 1000 });
            $(".toast").toast('show');
        },
        error: function(err, file) {
            $("#noRecord").modal('show');
        }
    });
});

console.log("test");