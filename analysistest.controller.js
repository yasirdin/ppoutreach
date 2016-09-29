ppoutreach.controller("analysisTestController", ['$scope', '$location', function($scope, $location) {


    $scope.plotConstants = {
        margin: {top: 10, right: 10, bottom: 30, left: 10},
        width: 1100 - 10 - 10,
        height: 500 - 10 - 30
    };

    $scope.histPlot = function(sigData, bgData, histClass, bincount, varName) {

        var c = $scope.plotConstants;

        var svg = d3.select(histClass).append("svg")
            .attr("width", c.width + c.margin.left + c.margin.right)
            .attr("height", c.height + c.margin.top + c.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

        var axis = svg.append("g")
            .attr("transform", "translate(0," + c.height + ")");

        //check which dataset has the largest range and set plot scales to it:

        //signal range:
        var sigRange = d3.max(sigData) - d3.min(sigData);

        //bg range:
        var bgRange = d3.max(bgData) - d3.min(bgData);

        //assigning the widest ranging dataset to var data for setting scales.
        if (sigRange > bgRange) {
            var scaleData = sigData;
        }

        if (bgRange > sigRange) {
            var scaleData = bgData;
        }

        //settings x-scale using widest ranging dataset (sig OR bg):
        var x = d3.scaleLinear()
            .domain([d3.min(scaleData), d3.max(scaleData)])
            .rangeRound([0, c.width]);

        //cutting input data into nested array of bins

        //TODO: put plotting inside of a function:

        //PLOTTING SIGNAL:
        var sigBins = d3.histogram()
            .thresholds(x.ticks(bincount))
            (sigData);

        var sigY = d3.scaleLinear()
            .domain([0, d3.max(sigBins, function (d) {
                return d.length; })])
            .range([c.height, 0]);

        //data bind:
        var sigBar = svg.selectAll(".sigBar")
            .data(sigBins);

        //enter
        //each bar is appended to the svg as a group (<g>) element:
        var gSigBar = sigBar.enter().append("g");

        //update
        gSigBar.attr("class", "sigBar")
            .attr("stroke", "white")
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + sigY(d.length) + ")";
            })
            .append("rect")
            .attr("fill", "steelblue")
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0)
            })
            .attr("height", function (d) {
                return c.height - sigY(d.length)
            });

        //plotting BACKGROUND data:
        var bgBins = d3.histogram()
            .thresholds(x.ticks(bincount))
            (bgData);

        var bgY = d3.scaleLinear()
            .domain([0, d3.max(bgBins, function (d) {
                return d.length;})])
            .range([c.height, 0]);

        //data bind:
        var bgBar = svg.selectAll(".bgBar")
            .data(bgBins);

        //enter
        //each bar is appended to the svg as a group (<g>) element:
        var gBgBar = bgBar.enter().append("g");

        //update
        gBgBar.attr("class", "bgBar")
            .attr("stroke", "white")
            .attr("opacity", 0.3)
            .attr("fill", "red")
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + bgY(d.length) + ")";
            })
            .append("rect")
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0)
            })
            .attr("height", function (d) {
                return c.height - bgY(d.length)
            });

        //checking if the dataset that is being plotted is signal or background:

        //update axis:
        axis.call(d3.axisBottom(x));

        //TODO: save plot scales to $scope for cutPlot to access
        //saving the variable dependent x-y scale definitions on the $scope
        //$scope.plotScales[varName] = {};
        //$scope.plotScales[varName].x = x;
        //$scope.plotScales[varName].y = y;
    };
    
    // COMBINING SIGNAL, BACKGROUND DATA:
    $scope.combineData = function(signalData, backgroundData) {

        //appending signal and background labels to datasets:
        for (i = 0; i < signalData.length; i++) {
            signalData[i].push("S");
        }

        for (i = 0; i < backgroundData.length; i++) {
            backgroundData[i].push("B");
        }

        //concatenating signal and background arrays:
        $scope.mainData = signalData.concat(backgroundData);

    };



    // SLIDER DATA CUTTER:

    $scope.sliderCut = function(sigData, bgData, sliderModel, varName, colNum) {
        
    };



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //signal:
    d3.json("data/hh4.json", function(error, sigData) {
        if (error) { throw error; }

        //background:
        d3.json("data/ttbar3.json", function(error, bgData) {
            if (error) { throw error;}

            //extracting variable data:
            function varExtract(data, col) {
                if (data) {
                    return data.map(function (value, index) {
                        return value[col];
                    });
                }
            }

            //combining both datasets and labelling signal and background events
            $scope.combineData(sigData, bgData);


            //signal variables:
            $scope.mbbSig = varExtract(sigData, 0);
            $scope.drSig = varExtract(sigData, 1);

            //background variables:
            $scope.mbbBg = varExtract(bgData, 0);
            $scope.drBg = varExtract(bgData, 1);

            //plotting static signal over background plot:
            $scope.histPlot($scope.mbbSig, $scope.mbbBg, ".mbbHistSigBg", 60, "mbb");


            
            
        });
    });

    //$scope.plotSigBg("data/hh4.json", "data/ttbar3.json", ".mbbHistSigBg")

}]);
