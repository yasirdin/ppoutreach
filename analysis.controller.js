ppoutreach.controller('analysisController', ['$scope', '$location', function ($scope, $location) {

    $scope.go = function(path) {
        $location.path(path);
    };

    $scope.plotConstants = {
        margin: {top: 10, right: 50, bottom: 30, left:50},
        width: 1000 - 50 - 50,
        height: 500 - 10 - 30
    };

    //object for storing x-y scales:
    var plotScales = $scope.plotScales = {};

    //function for plotting static variable histogram
    $scope.histPlot = function(sliderId, data, histClass, bincount) {

        //setting slider limits
        d3.select(sliderId)
            .attr("min", d3.min(data))
            .attr("max", d3.max(data))
            .attr("step", "any");

        var c = $scope.plotConstants;

        var svg = d3.select(histClass).append("svg")
            .attr("width", c.width + c.margin.left)
            .attr("height", c.height + c.margin.top + c.margin.bottom);

        var axis = svg.append("g")
            .attr("transform", "translate(0," + height + ")");

        var x = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .rangeRound([0, width]);

        //cutting input data into nested array of bins
        var bins = d3.histogram()
            .thresholds(x.ticks(bincount))
            (data);

        var y = d3.scaleLinear()
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
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .append("rect")
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0)
            })
            .attr("height", function (d) {
                return height - y(d.length)
            });

        //update axis:
        axis.call(d3.axisBottom(x));
    };

    //TODO: make x-y scale definitions independent for each variable
    $scope.cutPlot = function(cutVariable, histClass, bincount) {
        //watching cutVariable data:
        $scope.$watch(cutVariable, function(data) {
            //calling plot constants:
            var c = $scope.plotConstants;

            var svg = d3.select(histClass).select("svg");

            var bins = d3.histogram()
                .thresholds(scales.x.ticks(bincount))
                (data);

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
    };

    //IMPORTING DATA and calling functions:
    d3.json("data/hh4.json", function(err, data) {
        if (err) { throw err; }

        //saving data to the scope
        $scope.mainData = data;

        //creating function to extract arrays for each variable, put on $scope so reusable elsewhere:
        function varExtract(data, col) {
            return data.map(function(value, index) {
                return value[col];
            })
        }

        //defining variable arrays:
        $scope.mbb = varExtract(data, 0);
        $scope.dr = varExtract(data, 1);
        $scope.hpt = varExtract(data, 2);
        $scope.taupt = varExtract(data, 3);

        //plotting static histogram and slider:
        $scope.histPlot("#mbbSlider", $scope.mbb, ".mbbHist", 50);
        $scope.histPlot("#drSlider", $scope.dr, ".drHist", 50);

        //TODO: functionise the following processes:

        //creating object to store datacut values:
        $scope.dataCuts = {};

        //watching slider values to apply cuts to mainData:
        $scope.$watch('mbbSlider', function(slider) {
            if (!slider) { return; }

            //appending cut value to $scope.dataCuts:
            $scope.dataCuts.mbbCutVal = slider;
            console.log($scope.dataCuts);

            //function for filtering data
            function cutCheck(entry) {
                return entry[0] <= slider;
            }

            //filtering data:
            $scope.cuttingData = $scope.mainData.filter(cutCheck);
        });

        //watching mainData to dynamically adjust variable cut data:
        $scope.$watch('cuttingData', function(data) {
            $scope.mbbCut = varExtract(data, 0);
            $scope.drCut = varExtract(data, 1);
        }, true);
    });

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
        dataCuts = {
            ptCut : slider
        };

        //filtering the data -- this works dynamically:
        function cutCheck(entry) {
            return entry <= dataCuts.ptCut;
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

}]);




