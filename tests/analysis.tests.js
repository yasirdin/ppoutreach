/**
 * Created by yasir on 24/08/16.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////  TESTING  /////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//object for storing scales
var scales = $scope.scales = {};

$scope.plotHist = function() {
    //defining constants (independent of the data)
    var margin = {top: 10, right: 50, bottom: 30, left: 50},
        width = 1000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var svg = d3.select(".ptHist").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var axis = svg.append("g")
        .attr("transform", "translate(0," + height + ")");

    //importing data and defining variables dependent on the data:
    d3.json("data/testPt.json", function (err, data) {
        if (err) { throw err; }

        //save data to the controllers $scope:
        $scope.data = data;

        //setting sliders limits:
        d3.select("input")
            .attr("min", d3.min(data))
            .attr("max", d3.max(data))
            .attr("step", "any");

        scales.x = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .rangeRound([0, width]);

        var bincount = 15;

        //cutting input data into nested array of bins
        var bins = d3.histogram()
            .thresholds(scales.x.ticks(bincount))
            (data);

        scales.y = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })])
            .range([height, 0]);

        //data bind
        var bar = svg.selectAll(".bar")
            .data(bins);
        //enter
        //each bar is appended to the svg as a group (<g>) element:
        var gbar = bar.enter().append("g");

        //update
        gbar.attr("class", "bar")
            .attr("stroke", "white")
            .attr("transform", function (d) {
                return "translate(" + scales.x(d.x0) + "," + scales.y(d.length) + ")";
            })
            .append("rect")
            .attr("width", function (d) {
                return scales.x(d.x1) - scales.x(d.x0)
            })
            .attr("height", function (d) {
                return height - scales.y(d.length)
            });

        //update axis:
        axis.call(d3.axisBottom(scales.x));
    });
};

// DATA CUTTER
//cutting the data, given slider position and plot onto the same canvas:
$scope.$watch('ptSlider', function(slider){
    if (!slider) { return; }

    //defining datacuts array:
    dataCutsTest = {
        ptCut : slider
    };

    //filtering the data -- this works dynamically:
    function cutCheck(entry) {
        return entry <= dataCutsTest.ptCut;
    }

    $scope.cutData = $scope.data.filter(cutCheck);

    console.log($scope.cutData);

});

// CUT DATA PLOTTER
//watching the data and plotting the cut distributions, using scales defined in scales object
var margin = {top: 10, right: 50, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

$scope.$watch('cutData', function(data) {
    if (!data) { return; }

    var svg = d3.select("svg");

    var bincount = 15;

    //cutting input data into nested array of bins
    var bins = d3.histogram()
        .thresholds(scales.x.ticks(bincount))
        (data);

    //temporary solution to binning problem, this redraws all data (may be resource intensive):
    svg.selectAll(".cutbar").remove();

    //data bind
    var bar = svg.selectAll(".cutbar")
        .data(bins);

    var gbar = bar.enter().append("g")
        .attr("class", "cutbar")
        .attr("transform", function (d) {
            return "translate(" + scales.x(d.x0) + "," + scales.y(d.length) + ")";
        });

    gbar.append("rect")
        .style("opacity", 0.5)
        .attr("fill", "red")
        .attr("width", function (d) {
            return scales.x(d.x1) - scales.x(d.x0)
        })
        .attr("height", function (d) {
            return height - scales.y(d.length);
        });

}, true);

//running the functions:
$scope.plotHist();
