ppoutreach.controller('analysisController', ['$scope', '$location', function ($scope, $location) {
    $scope.message = 'Welcome to the analysis exercise';

    $scope.go = function(path) {
        $location.path(path);
    };

    //TODO: this method of defining scales doesn't look right, find a more idomatic way to do this:
    //object for storing scales
    var scales = $scope.scales = {};

    $scope.plotHist = function() {
        //defining constants (independent of the data)
        var margin = {top: 10, right: 50, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
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

            d3.select("input")
                .attr("min", 120.317)
                .attr("max", 130.579)
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
                    return height - scales.y(d.length);
                });

            //update axis:
            axis.call(d3.axisBottom(scales.x));
        });
    };

    // DATA CUTTER
    //cutting the data, given slider position and plot onto the same canvas:
    $scope.$watch('slider', function(slider){
        if (!slider) { return; }

        //defining datacuts array:
        dataCuts = {
            ptCut : slider
        };

        //filtering the data -- this works dynamically:
        function cutCheck(entry) {
            return entry <= dataCuts.ptCut;
        }

        $scope.cutData = $scope.data.filter(cutCheck);

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

        //temporary solution to binning problem, this redraws all data:
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
            .attr("width", function (d) {
                return scales.x(d.x1) - scales.x(d.x0)
            })
            .attr("height", function (d) {
                return height - scales.y(d.length);
            });
        
    }, true);

    //TODO: have the functions run within the d3.json callback
    //running the functions:
    $scope.plotHist();

}]);




