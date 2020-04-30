function sorter(a, b){
    floatA = parseFloat(a);
    floatB = parseFloat(b);
    if(isNaN(floatA) && isNaN(floatB))
        return a <= b ? -1 : 1;
    if(isNaN(floatA) || isNaN(floatB))
        return a.length <= b.length ? -1 : 1;
    return floatA <= floatB ? -1 : 1;
}

function valueFormatter(value, type){
    if(type === 'display' || type === 'filter') {
        if(!value || isNaN(value))
            return value;
        return +(Math.round(value + "e+3") + "e-3");
    }
    return parseFloat(value);
}

function addTooltip(){
    $("#table tbody tr").each(function(){
        var tds = $('td', this);
        this.setAttribute('title', $(tds[0]).text() + ' , ' + $(tds[1]).text());
    });
}

function addMinMax(){
    var table = $("#table").DataTable(); 
    var count = -1;
    table.columns().every(function() {
    var data = this.data();
    count++;
    if(count >= 3){
        var sorted = data.sort(sorter);
        var maxVal = sorted[sorted.length - 1];
        var i = 0;
        while(!sorted[i++]);
        var minVal = sorted[i - 1];
        // console.log(valueFormatter(maxVal, 'display'));
            this.nodes().to$().each(function(){
                $(this).removeClass('max min');
                // console.log(valueFormatter(this.innerHTML));
                if(valueFormatter(this.innerHTML, 'display') == valueFormatter(maxVal, 'display'))
                    $(this).addClass('max');
                else if(valueFormatter(this.innerHTML, 'display') == valueFormatter(minVal, 'display'))
                    $(this).addClass('min');
            });
    }
    });
}

//https://raw.githubusercontent.com/saranshbht/Project/master/Marks/Semester/16/570/015.csv
var obj = new URL(location.href).searchParams;
var path = obj.get("type") + "/" + obj.get("mode") + "/" + obj.get("admissionsOf") + "/" + obj.get("course") + "/";
var file =  path + obj.get("college") + ".csv";
var baseUrl = "https://raw.githubusercontent.com/saranshbht/Project/master/";

Papa.parse(baseUrl + 'codes/collegeCodes.csv', {
    download: true,
    complete: function(results) {
        var list = $("#college");
        results.data.shift();
        $.each(results.data, function(index, item) {
            list.append(new Option(item[1], item[0]));
        });
        $("#college option[value='015']").prop('selected', true);
        // console.log(results.data);
    },
    error: function(err, file){ 
        // $("#noRecord").modal('show');
        // $('#noRecord').on('hidden.bs.modal', function() {
        //     history.back();
        // });
        console.log("can't load file");
    }
});

Papa.parse(baseUrl + 'codes/courseCodes.csv', {
    download: true,
    complete: function(results) {
        var list = $("#course");
        results.data.shift();
        $.each(results.data, function(index, item) {
            list.append(new Option(item[1], item[0]));
        });
        $("#course option[value='570']").prop('selected', true);
        // console.log(results.data);
    },
    error: function(err, file){ 
        // $("#noRecord").modal('show');
        // $('#noRecord').on('hidden.bs.modal', function() {
        //     history.back();
        // });
        console.log("can't load file");
    }
});


Papa.parse(baseUrl + file, {
    download: true,
    complete: function(results) {
        var headerRow = results.data[0];
        var columnData = [];
        for(let i = 0; i < headerRow.length; i++){
            columnData.push({title: headerRow[i], render: valueFormatter});
        }
        results.data.pop();
        $("#table").DataTable({
            data: results.data.slice(1),
            columns: columnData,
            paging: false,
            fixedHeader : true,
            dom: 'frBt',
            buttons: [
                'print',
            ]
        });
        addTooltip();
        addMinMax();
        // table.draw();
    },
    error: function(err, file){ 
        $("#noRecord").modal('show');
        $('#noRecord').on('hidden.bs.modal', function() {
            history.back();
        });
        
    }
});

$("#addCollegeButton").click(function(){
    var e = $("#addCollegeSelect").val();
    file1 = path + e + '.csv';
    Papa.parse(baseUrl + file1, {
        download: true,
        complete: function(results) {
            results.data.pop();
            var table = $("#table").DataTable();
            table.rows.add(results.data.slice(1));
            addTooltip();
            addMinMax();
            table.draw();
        },
        error: function(err, file){ 
            $("#noRecord").modal('show');
        }
    });
});

