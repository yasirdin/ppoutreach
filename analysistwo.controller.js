ppoutreach.controller('analysisTwoController', ['$scope', '$location', '$mdDialog', function ($scope, $location, $mdDialog) {


    ///CONSTANTS:///
    $scope.plotConstants = {
        margin: {top: 10, right: 40, bottom: 30, left: 40},
        width: 1100 - 40 - 40,
        height: 500 - 10 - 30
    };

    $scope.plotScales = {};

    $scope.combinedData = {};

    $scope.bincount = 60;
    ///CONSTANTS END///

    $scope.go = function(path) {
        $location.path(path);
    };
    
    $scope.histPlot = function(sigData, bgData, histClass, varName) {

        var c = $scope.plotConstants;

        //COMPUTING SCALES//
        ////xScale///:
        var sigRange = d3.max(sigData) - d3.min(sigData),
            bgRange = d3.max(bgData) - d3.min(bgData);

        if (sigRange > bgRange) {
            var scaleData  = sigData;
        }
        else {
            var scaleData = bgData;
        }

        //setting xScale:
        var x = d3.scaleLinear()
            .domain([d3.min(scaleData), d3.max(scaleData)])
            .range([0, c.width]);

        //setting yScale given above conditions:
        var y = d3.scaleLinear()
            .domain([0, 3000])
            .range([c.height, 0]);

        //store variable scales on $scope.plotScales object:
        $scope.plotScales[varName] = {};
        $scope.plotScales[varName].x = x;
        $scope.plotScales[varName].y = y;

        //END OF COMPUTING SCALES//

        var c = $scope.plotConstants;

        var svg = d3.select(histClass).append("svg")
            .attr("width", c.width + c.margin.left + c.margin.right)
            .attr("height", c.height + c.margin.top + c.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

        //binning data:
        var sigBins = d3.histogram()
            .thresholds(x.ticks($scope.bincount))
            (sigData);

        //data bind:
        var sigBar = svg.selectAll(".sigBar")
            .data(sigBins);

        var gSigBar = sigBar.enter().append("g");

        //update
        gSigBar.attr("class", "sigBar")
            .attr("stroke", "white")
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .append("rect")
            .attr("fill", "steelblue")
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0)
            })
            .attr("height", function (d) {
                return (c.height - y(d.length))
            });

        //binning data:
        var bgBins = d3.histogram()
            .thresholds(x.ticks($scope.bincount))
            (bgData);

        //data bind:
        var bgBar = svg.selectAll(".bgBar")
            .data(bgBins);

        //enter
        //each bar is appended to the svg as a group (<g>) element:
        var gBgBar = bgBar.enter().append("g");

        //update
        gBgBar.attr("class", "bgBar")
            .attr("stroke", "white")
            .attr("opacity", 1.0)
            .attr("fill", "maroon")
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

        //checking if the dataset that is being plotted is signal or background:

        //update axis:
        var gAxis = svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + c.height + ")")
            .call(d3.axisBottom(x));
    };
    
    $scope.sliderCut = function(sliderModel, data) {
        $scope.$watch(sliderModel, function(value) {

            var sliderVal = value;

            $scope.cutData = data.slice(Math.round((20000 * sliderVal))); // insertfiltered array given slider value
        }, true);
    };

    $scope.combineData = function(sigData, bgData, varName) {

        //appending signal and background labels to datasets:
        for (i = 0; i < sigData.length; i++) {
            sigData[i] = [sigData[i], "S"];
        }

        for (i = 0; i < bgData.length; i++) {
            bgData[i] = [bgData[i], "B"];
        }

        //concatenating signal and background arrays:
        $scope.combinedData[varName] = {};
        $scope.combinedData[varName].data = sigData.concat(bgData);
    };
    
    ////////////////////////////////////////////////////////////////////

    d3.json("data/hh4.json", function(error, sigData) {
        if (error) {
            throw error;
        }

        //background:
        d3.json("data/ttbar3.json", function (error, bgData) {
            if (error) {
                throw error;
            }

            // function for extracting variable data:
            function varExtract(data, col) {
                if (data) {
                    return data.map(function (value, index) {
                        return value[col];
                    });
                }
            }

            //signal variables:
            $scope.mbbSig = varExtract(sigData, 0);
            $scope.drSig = varExtract(sigData, 1);
            $scope.hptSig = varExtract(sigData, 2);
            $scope.tauptSig = varExtract(sigData, 3);

            //background variables:
            $scope.mbbBg = varExtract(bgData, 0);
            $scope.drBg = varExtract(bgData, 1);
            $scope.hptBg = varExtract(bgData, 2);
            $scope.tauptBg = varExtract(bgData, 3);

            //plotting first static plot
            $scope.histPlot($scope.mbbSig.slice(5000), $scope.mbbBg, ".mbbSensitivityPlot", "mbb");

            //TODO: combine signal and background for mbb with labels for signal and background:
            //data is saves to the $scope.combinedData object here:
            $scope.combineData($scope.mbbSig, $scope.mbbBg, "mbb");

            console.log($scope.combinedData["mbb"]);

            //array shuffle function
            $scope.shuffleArray = function(array) {
                for (var i = array.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
                return array;
            };

            //shuffling dataset:
            $scope.shuffleArray($scope.combinedData["mbb"].data);

            $scope.sliderCut("mbbSlider", $scope.combinedData["mbb"].data);
            
            //FOR mbb only:

            $scope.$watch('cutData', function(data) {
                //extracting signal and background events and creating arrays for each:
                var sigArray = [];

                for (i = 0; i < data.length; i++) {
                    if (data[i][1] == "S") {
                        sigArray.push(data[i][0]);
                    }
                }

                var bgArray = [];

                for (i = 0; i < data.length; i++) {
                    if (data[i][1] == "B") {
                        bgArray.push(data[i][0]);
                    }
                }

                //////////REPLOTTING the data onto the same canvas FOR MBB ONLY:///////
                var scales = $scope.plotScales["mbb"];

                var c = $scope.plotConstants;

                var svg = d3.select(".mbbSensitivityPlot").select("svg").select("g");

                //slicing signal data to scale better:
                sigArray = sigArray.slice(sigArray.length / 2);

                /////plot signal////:

                var sigBins = d3.histogram()
                    .thresholds(scales.x.ticks($scope.bincount))
                    (sigArray);

                svg.selectAll(".sigBar").remove();

                var sigBar = svg.selectAll(".sigBar")
                    .data(sigBins);

                var gSigBar = sigBar.enter().append("g");

                //update
                gSigBar.attr("class", "sigBar")
                    .attr("stroke", "white")
                    .attr("transform", function (d) {
                        return "translate(" + scales.x(d.x0) + "," + scales.y(d.length) + ")";
                    })
                    .append("rect")
                    .attr("fill", "steelblue")
                    .attr("width", function (d) {
                        return scales.x(d.x1) - scales.x(d.x0)
                    })
                    .attr("height", function (d) {
                        return (c.height - scales.y(d.length))
                    });


                ////plot background//////:
                var bgBins = d3.histogram()
                    .thresholds(scales.x.ticks($scope.bincount))
                    (bgArray);


                svg.selectAll(".bgBar").remove();


                var bgBar = svg.selectAll(".bgBar")
                    .data(bgBins);

                //enter
                //each bar is appended to the svg as a group (<g>) element:
                var gBgBar = bgBar.enter().append("g");

                //update
                gBgBar.attr("class", "bgBar")
                    .attr("stroke", "white")
                    .attr("opacity", 1.0)
                    .attr("fill", "maroon")
                    .attr("transform", function (d) {
                        return "translate(" + scales.x(d.x0) + "," + scales.y(d.length) + ")";
                    })
                    .append("rect")
                    .attr("width", function (d) {
                        return scales.x(d.x1) - scales.x(d.x0)
                    })
                    .attr("height", function (d) {
                        return (c.height - scales.y(d.length))
                    });
            }, true);

            //plotting points corresponing to cutVal/sliderVal of 0.1

            //ADDING ARTIFICIAL DATAPOINT TO PLOT:

            var dataPlotData = varExtract($scope.mbbSig, 0).concat(varExtract($scope.mbbBg, 0));

            $scope.shuffleArray(dataPlotData);

            //var datapointData = dataPlotData.slice(Math.round())

            var cutData = dataPlotData.slice(Math.round((20000 * 0.1)));

            //bin cutdata to get length of each bin

            var cutBins = d3.histogram()
                .thresholds($scope.plotScales["mbb"].x.ticks($scope.bincount))
                (cutData);

            var dataPlotPointsY = [];
            //creating lengths array to plot:
            for (i = 0; i < cutBins.length; i++) {
                dataPlotPointsY.push(cutBins[i].length);
            }

            console.log(dataPlotPointsY);

        });
    });
}]);
