var data = [];
var data2 = [];

var fullScanTime = {
    "simple": 1000,
    "simple2": 1000,
};

function datamin(data) {
    return Math.min.apply(null, data.map(function(s) { return s.time; }));
}

function datamax(data) {
    return Math.max.apply(null, data.map(function(s) { return s.time; }));
}

function InitChart(data, data2) {
    $('#visualisation').remove();
    $('#viz').append("<svg id=\"visualisation\" width=\"800\" height=\"350\"></svg>");

    var vis = d3.select("#visualisation"),
        WIDTH = 800,
        HEIGHT = 350,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 50
        },
        xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([1, data.length]),
        ymin = Math.min(datamin(data), datamin(data2)),
        ymax = Math.max(datamax(data), datamax(data2)),
        yScale = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0, ymax]),
        xAxis = d3.svg.axis()
        .scale(xScale),
        yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    console.log(ymin, ymax);

    vis.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
        .call(xAxis);
    vis.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (MARGINS.left) + ",0)")
        .call(yAxis);
    var lineGen = d3.svg.line()
        .x(function(d) {
            return xScale(d.qno);
        })
        .y(function(d) {
            return yScale(d.time);
        })
        .interpolate("linear");
    vis.append('svg:path')
        .attr('d', lineGen(data))
        .attr('stroke', 'green')
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    vis.append('svg:path')
        .attr('d', lineGen(data2))
        .attr('stroke', 'red')
        .attr('stroke-width', 1)
        .attr('fill', 'none');
}

function drawNormal() {
    InitChart(data, data2);
}

function cloneData(data) {
    var newData = [];
    for (var i=0; i<data.length; i++) {
        newData.push($.extend({}, data[i]));
    }

    return newData;
}

function genCDF(origData) {
    var data = cloneData(origData);
    var s = 0;
    for (var i=0; i<data.length; i++) {
        s += data[i].time;
        data[i].time = s;
    }

    return data;
}

function drawCDF() {
    InitChart(genCDF(data), genCDF(data2));
}

$('#cdfchartbtn').click(drawCDF);
$('#linechartbtn').click(drawNormal);

var dataset = "simple";
var workload = "switching";

function setupScreen() {
}

function setupWorkload() {
    console.log(dataset, workload);
    var queries = "";
    if (dataset == "simple") {
        if ($('#switch-after').val() == "")
            $('#switch-after').val(10);

        var switchPoint = parseInt($('#switch-after').val());
        if (workload == "switching") {
            for (var i=0; i<switchPoint; i++) {
                queries += "A <= 500\n";
            }
            for (var i=0; i<1; i++) {
                queries += "B <= 500\n";
            }
        } else if (workload == "random") {
            for (var i=0; i<switchPoint; i++) {
                if (Math.random() < 0.5)
                    queries += "A <= 500\n";
                else
                    queries += "B <= 500\n";
            }
        } else if (workload == "cyclic") {
            for (var i=0; i<switchPoint; i++) {
                queries += "A <= 500\n";
            }
            for (var i=0; i<switchPoint; i++) {
                queries += "B <= 500\n";
            }
        }
        $('#query-text').val(queries);
    }
    else if (dataset == "simple2") {
        if ($('#switch-after').val() == "")
            $('#switch-after').val(10);

        var switchPoint = parseInt($('#switch-after').val());
        if (workload == "switching") {
            for (var i=0; i<switchPoint; i++) {
                queries += "A > 400;A <= 500\n";
            }
            for (var i=0; i<1; i++) {
                queries += "B > 400;B <= 500\n";
            }
        } else if (workload == "random") {
            for (var i=0; i<switchPoint; i++) {
                if (Math.random() < 0.5)
                    queries += "A > 400;A <= 500\n";
                else
                    queries += "B > 400;B <= 500\n";
            }
        } else if (workload == "cyclic") {
            for (var i=0; i<switchPoint; i++) {
                queries += "A > 400;A <= 500\n";
            }
            for (var i=0; i<switchPoint; i++) {
                queries += "B > 400;B <= 500\n";
            }
        }
        $('#query-text').val(queries);
    }
}

function updateData(res) {
    var lines = res.split("\n");
    var newData = [];
    var qno = 1;
    var predicatesInserted = [];
    for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        if (line.startsWith("INFO: Predicates inserted:")) {
            var parts = line.split('INFO: Predicates inserted:');
            predicatesInserted.push(parts[1]);
        }
    }
    var predIndex = 0;

    var cVal = parseFloat($('#c').val());
    for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        if (line.startsWith("INFO: Benefit")) {
            console.log(line);
            var parts = line.split(' ');
            var c1 = parseFloat(parts[2]),
                c2 = parseFloat(parts[4]),
                c3 = parseFloat(parts[7]);
            var cost;
            if (c1 > c2) {
                cost = (c3 - c2) + (c2 / cVal) * 4.0;
                newData.push({"qno": qno, "time": cost, "predInserted": predicatesInserted[predIndex]});
                predIndex += 1;
            } else {
                cost = (c3 - c2) + (c2 / cVal);
                newData.push({"qno": qno, "time": cost });
            }
            qno += 1;
        }
    }

    console.log("1");
    data = newData;
    console.log("2");

    var newData2 = [];
    for (var i=0; i<data.length; i++) {
        newData2.push({"qno": data[i].qno, "time": fullScanTime[dataset] });
    }
    data2 = newData2;

    console.log("3");
    console.log(data, data2);
}

function loadStats(res, data, data2) {
    console.log(res, data, data2);
    var numQueries = data.length;
    var sum1 = 0, sum2 = 0;
    var numUpdates = 0;
    for (var i=0; i<data.length; i++) {
        sum1 += data[i].time;
        sum2 += data2[i].time;
        if (data[i].predInserted) numUpdates += 1;
    }

    $('#num-queries').text(numQueries);
    $('#amoeba-runtime').text(sum1);
    $('#just-hdfs').text(sum2);
    $('#gain-ratio').text(sum2/sum1);
    $('#repartitioning-rounds').text(numUpdates);

    var initialTree, finalTree;
    var lines = res.split("\n");
    for (var i=0; i<lines.length; i++) {
        if (lines[i].startsWith("INFO: Final Tree Node:")) {
            var parts = lines[i].split("INFO: Final Tree Node:");
            finalTree = parts[1];
        }

        if (lines[i].startsWith("INFO: Initial Tree Node:")) {
            var parts = lines[i].split("INFO: Initial Tree Node:");
            initialTree = parts[1];
        }
    }

    $('#initialTree').text(initialTree);
    $('#finalTree').text(finalTree);

    $('#treeChanges').html('');
    var treeChangeText = '';
    for (var i=0; i<data.length; i++) {
        if (data[i].predInserted) {
            treeChangeText += '<li> Update at query ' + data[i].qno + ' , inserted ' + data[i].predInserted + '</li>';
        }
    }
    $('#treeChanges').html(treeChangeText);
}

function runWorkload() {
    $('#run').html('<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>');
    $.post("http://127.0.0.1:5000", { dataset: dataset, workload: $('#query-text').val(), c: $('#c').val() })
    .done(function(res) {
        console.log(res);
        updateData(res);
        InitChart(data, data2);
        loadStats(res, data, data2);
        $('#stats').removeClass("hidden");
        $('#viz').removeClass("hidden");
        $('#run').html('Run &gt;');
    });
    return false;
}

$("#select-dataset .dropdown-menu li a").click(function(){
    dataset = $(this).text().toLowerCase();
    $("#select-dataset .btn").html($(this).text() + " <span class=\"caret\"></span>");
});

$("#select-workload a").click(function(){
    workload = $(this).text().toLowerCase();
    setupScreen();
    setupWorkload();
});

$('#switch-after').change(setupWorkload);

$('#run').click(runWorkload);

$('#cost-calc').click(function() {$('#cost-calc-show').removeClass('hidden');});
