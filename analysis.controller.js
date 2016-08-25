ppoutreach.controller('analysisController', ['$scope', '$location', function ($scope, $location) {

    $scope.go = function(path) {
        $location.path(path);
    };

    $scope.plotConstants = {
        margin: {top: 10, right: 50, bottom: 30, left:50},
        width: 1000 - 50 - 50,
        height: 500 - 10 - 30
    };

    //object to store x-y scales for plots for each variable
    $scope.plotScales = {};

    //TODO: make x-y definitions independent for each variable - store on $scope object
    //function for plotting static variable histogram
    $scope.histPlot = function(sliderId, data, histClass, bincount, varName) {

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
            .attr("transform", "translate(0," + c.height + ")");

        var x = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .rangeRound([0, c.width]);

        //cutting input data into nested array of bins
        var bins = d3.histogram()
            .thresholds(x.ticks(bincount))
            (data);

        var y = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length; })])
            .range([c.height, 0]);

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
                return c.height - y(d.length)
            });

        //update axis:
        axis.call(d3.axisBottom(x));

        //saving the variable dependent x-y scale definitions on the $scope
        $scope.plotScales[varName] = {};
        $scope.plotScales[varName].x = x;
        $scope.plotScales[varName].y = y;
    };

    //TODO: call x-y scale definitions for each variable
    $scope.cutPlot = function(histClass, data, bincount, varName) {
        //calling plot constants:
        var c = $scope.plotConstants;
        var scales = $scope.plotScales[varName];

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
                return c.height - scales.y(d.length);
            });
    };

    //function for watching sliders and applying multiple cuts:
    $scope.dataCuts = {};

    $scope.sliderCut = function(sliderModel, varName, colNum) {
        $scope.$watch(sliderModel, function(slider) {
            if (!slider) { return; }

            //appending slider/cut value to $scope stored object
            $scope.dataCuts[varName] = slider;

            //function for filtering data:
            function cutCheck(entry) {
                return entry[colNum] <= slider;
            }

            //filtering data:
            $scope.cutMainData = $scope.mainData.filter(cutCheck);
            console.log($scope.cutMainData);
        });
    };

    //TODO: move out processes independent of data
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
        $scope.histPlot("#mbbSlider", $scope.mbb, ".mbbHist", 50, "mbb");
        $scope.histPlot("#drSlider", $scope.dr, ".drHist", 50, "dr");
        $scope.histPlot("#hptSlider", $scope.hpt, ".hptHist", 50, "hpt");

        //calling function to cut data given slider values:
        $scope.sliderCut("mbbSlider", "mbb", 0);
        $scope.sliderCut("drSlider", "dr", 1);
        $scope.sliderCut("hptSlider", "hpt", 2);

        //watching mainData to dynamically adjust variable cut data:
        $scope.$watch('cutMainData', function(data) {
            $scope.mbbCut = varExtract(data, 0);
            $scope.drCut = varExtract(data, 1);
            $scope.hptCut = varExtract(data, 2);
        }, true);

        //setting up $watch'ers to plot cutData
        $scope.$watch('mbbCut', function(data) {
            $scope.cutPlot(".mbbHist", data, 50, "mbb");
        }, true);

        $scope.$watch('drCut', function(data) {
            $scope.cutPlot(".drHist", data, 50, "dr");
        }, true);

        $scope.$watch('hptCut', function(data) {
            $scope.cutPlot(".hptHist", data, 50, "hpt");
        }, true);
    });
}]);




