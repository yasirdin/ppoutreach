ppoutreach.controller("analysisTestController", ['$scope', '$location', function($scope, $location) {

    $scope.plotConstants = {
        margin: {top: 10, right: 40, bottom: 30, left: 30},
        width: 1100 - 10 - 10 - 40,
        height: 500 - 10 - 30 - 40
    };

    $scope.plotScales = {};

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

        //X-SCALE:
        //assigning the widest ranging dataset to var data for setting xScale:
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

        //Y-SCALE:
        //binning first to find bin with highest number of entries:

        var sigBins = d3.histogram()
            .thresholds(x.ticks(bincount))
            (sigData);

        var bgBins = d3.histogram()
            .thresholds(x.ticks(bincount))
            (bgData);

        var sigBinMax = d3.max(sigBins, function(d) {
            return d.length;
        });

        var bgBinMax = d3.max(bgBins, function(d) {
            return d.length;
        });

        if (sigBinMax > bgBinMax) {
            var yDomainMax = sigBinMax;
        }

        if (bgBinMax > sigBinMax) {
            var yDomainMax = bgBinMax;
        }

        var y = d3.scaleLinear()
            .domain([0, yDomainMax])
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
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .append("rect")
            .attr("fill", "steelblue")
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0)
            })
            .attr("height", function (d) {
                return c.height - y(d.length)
            });

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
        axis.call(d3.axisBottom(x));

        //savings scales to $scope object for cutPlot:
        $scope.plotScales[varName] = {};
        $scope.plotScales[varName].x = x;
        $scope.plotScales[varName].y = y;
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

        //continually extract signal and background events
        //which ever bin is the greatest plot that

    };

    // SLIDER DATA CUTTER:

    $scope.sliderCut = function(sliderId, sliderModel, data, columnNumber) {
        //set slider limits using $scope.mainData (combined signal and background data):
        d3.selectAll(sliderId)
            .attr("min", d3.min(data))
            .attr("max", d3.max(data))
            .attr("step", "10.0");

        //storing slider variables:


        //data cutting function:
        $scope.$watch(sliderModel, function(sliderValue) {
            function cutCheck(entry) {
                if (entry)
                    return entry[columnNumber] <= sliderValue;
            }

            //filtering data -- applies cuts across all variables:
            $scope.cutMainData = $scope.mainData.filter(cutCheck);
        });
    };

    //CUT DATA PLOTTER:

    $scope.cutPlot = function(data, histClass, bincount, varName) {
        //calling plot constants:

        var c = $scope.plotConstants;
        var scales = $scope.plotScales[varName];

        var svg = d3.select(histClass).select("svg").select("g");

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
            .attr("fill", "green")
            .attr("width", function (d) {
                return scales.x(d.x1) - scales.x(d.x0)
            })
            .attr("height", function (d) {
                return c.height - scales.y(d.length);
            });
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //LOADING IN DATA AND CALLING FUNCTIONS:

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
            //combined data saved as $scope.mainData
            $scope.combineData(sigData, bgData);
            
            //signal variables:
            $scope.mbbSig = varExtract(sigData, 0);
            $scope.drSig = varExtract(sigData, 1);

            //background variables:
            $scope.mbbBg = varExtract(bgData, 0);
            $scope.drBg = varExtract(bgData, 1);

            //plotting static signal over background plot:
            $scope.histPlot($scope.mbbSig, $scope.mbbBg, ".mbbHistSigBg", 60, "mbb");
            
            //setting slider limits and cutting function:
            $scope.sliderCut("#mbbSlider", "mbbSlider", varExtract($scope.mainData, 0), 0);

            $scope.$watch('cutMainData', function (data) {
                $scope.mbbCut = varExtract(data, 0);
            }, true);
            
            $scope.$watch("mbbCut", function(data) {
                if (data) {
                    $scope.cutPlot(data, ".mbbHistSigBg", 60, "mbb");
                }
            });

            //TODO: watching the whole of cutMainData may have some performance reprecussions, check this:
            //can merge this with the $watch(cutMainData above here)
            //SIGNAL/BACKGROUND count
            $scope.$watch('cutMainData', function(data) {
                //extracting final signal background label column
                var sigBgColumn = varExtract(data, 4);

                //counting signal and backgrounds:
                var sigCount = 0;
                for (i = 0; i < sigBgColumn.length; i++) {
                    if (sigBgColumn[i] == "S") {
                        sigCount++;
                    }
                }

                var bgCount = 0;
                for (i = 0; i < sigBgColumn.length; i++) {
                    if(sigBgColumn[i] == "B") {
                        bgCount++;
                    }
                }

                //TODO: limit the number of decimal places this is calculated to:
                //calculating signal/background ratio:
                $scope.sigEfficiency = (sigCount / data.length).toFixed(2) * 100;

                console.log($scope.sigEfficiency);

            });

            ///////////////////////// precomputing signal purity /////////////////////////////////

            //navigate to html object for the slider:
            var mbbSliderElement = document.getElementById("mbbSlider");

            //retrieve the attributes:
            var mbbMin = mbbSliderElement.getAttribute("min"),
                mbbMax = mbbSliderElement.getAttribute("max"),
                mbbStep = mbbSliderElement.getAttribute("step");

            //compute the number of entries in the array:
            var mbbEntriesNum = Math.round((mbbMax - mbbMin) / (mbbStep));

            //array to contain all the values the slider can take:
            var mbbSliderValsArray = [];

            for (i = 0; i < mbbEntriesNum + 1; i++) {
                mbbSliderValsArray.push(Math.round(mbbMin + i*mbbStep));
            }

            //extract mbb from maindata:
            var mbbCombined = varExtract($scope.mainData, 0);
            var mbbCombined2 = varExtract($scope.mainData, 4);

            //combining mbbCombined and mbbCombined2 into a nested array:
            var mbbCombinedFull = [];

            for (i = 0; i < mbbCombined.length; i++) {
                mbbCombinedFull.push([mbbCombined[i], mbbCombined2[i]]);
            }

            //TODO: for each slider value - filter mbbCombined, and calculate purity given filtered array:
            
            //function for filtering nested array:

            function cutCheck(entry) {
                if (entry)
                    //only for first column '[0]':
                    return entry[0] <= sliderValue;
            }

            var significanceValsArray = [];
            var purityValsArray = [];

            //iterating over slider values and calculating purities for each configuration:
            for (i = 0; i < mbbSliderValsArray.length; i++) {

                var sliderValue = mbbSliderValsArray[i];

                //defines a cutMbbArray for this iterations slider value:
                var cutMbbArray = mbbCombinedFull.filter(cutCheck);

                //slicing the signal/background column:
                var sigBgColumn = varExtract(cutMbbArray, 1);

                var sigCount = 0;
                var bgCount = 0;
                for (var j = 0; j < sigBgColumn.length ; j++) {
                    if (sigBgColumn[j] == "S") {
                        sigCount++;
                    }
                    if (sigBgColumn[j] == "B") {
                        bgCount++;
                    }
                }

                //calculating purity given sigCount and bgCount:
                    var purity = sigCount / (sigCount + bgCount) * 100;
                    var purity = purity.toFixed(2);
                    purityValsArray.push(purity);

                //calculating significance given sigCount and bgCount:
                    var significance = sigCount / Math.sqrt((sigCount + bgCount) * 100);
                    var significance = significance.toFixed(2);
                    significanceValsArray.push(significance);
            }

            //combining purity and slider values into nested array:
            var mbbPurityCutVals = [];
            for (i = 0; i < purityValsArray.length; i++ ) {
                mbbPurityCutVals.push([mbbSliderValsArray[i], purityValsArray[i]])
            }
            
            //combining significance and slider values into nested array:
            var mbbSignificanceCutVals = [];
            for (i = 0; i < significanceValsArray.length; i++) {
                mbbSignificanceCutVals.push([mbbSliderValsArray[i], significanceValsArray[i]])
            }

            ///////plotting purity VS mbbSliderValsArray///////////////
            var c = $scope.plotConstants;

            var svg = d3.select(".mbbPurityScatter").append("svg")
                .attr("width", c.width + c.margin.left + c.margin.right)
                .attr("height", c.height + c.margin.top + c.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

            var x = d3.scaleLinear()
                .domain([d3.min(mbbSliderValsArray), d3.max(mbbSliderValsArray)])
                .rangeRound([ 0, c.width ]);

            var y = d3.scaleLinear()
                .domain([d3.min(purityValsArray), 70])
                .range([ c.height, 0 ]);

            var xAxis = svg.append("g")
                .attr("transform", "translate(0," + c.height + ")");

            xAxis.call(d3.axisBottom(x));

            var yAxis = svg.append("g")
                .attr("transform", "translate(0, 0)");

            yAxis.call(d3.axisLeft(y));

            //defining group to add points:
            var g = svg.append("g");

            var binding =  g.selectAll(".point")
                .data(mbbPurityCutVals);

            //watch current slider position:
            $scope.$watch("mbbSlider", function(sliderCurrent) {
                function filter(entry) {
                    if (entry[0] == sliderCurrent) {
                        return entry;
                    }
                }
                //filtering for array corresponding to slider value:
                $scope.currentPurityDatapoint = mbbPurityCutVals.filter(filter);
            });

            //TODO: initiate this using an ngClick
            $scope.purityPlotPoint = function () {

                var d = $scope.currentPurityDatapoint;

                //TODO: change the second entry into a number, not string:

                binding.enter().append("svg:circle")
                    .attr("r", 3)
                    .attr("cx", x(d[0][0]))
                    .attr("cy", y(d[0][1]));

            };

            /////////////////////////////////////////////  PLOTTING SIGNIFICANCE  ///////////////////////////////////
            $scope.significancePlot = function() {
                var c = $scope.plotConstants;

                var svg = d3.select(".mbbSignificanceScatter").append("svg")
                    .attr("width", c.width + c.margin.left + c.margin.right)
                    .attr("height", c.height + c.margin.top + c.margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

                var x = d3.scaleLinear()
                    .domain([d3.min(mbbSliderValsArray), d3.max(mbbSliderValsArray)])
                    .rangeRound([ 0, c.width ]);

                var y = d3.scaleLinear()
                    .domain([d3.min(significanceValsArray), 10])
                    .range([ c.height, 0 ]);

                var xAxis = svg.append("g")
                    .attr("transform", "translate(0," + c.height + ")");

                xAxis.call(d3.axisBottom(x));

                var yAxis = svg.append("g")
                    .attr("transform", "translate(0, 0)");

                yAxis.call(d3.axisLeft(y));

                var g = svg.append("g");

                var binding =  g.selectAll(".point")
                    .data(mbbSignificanceCutVals);

                //watch current slider position:
                $scope.$watch("mbbSlider", function(sliderCurrent) {
                    function filter(entry) {
                        if (entry[0] == sliderCurrent) {
                            return entry;
                        }
                    }
                    //filtering for array corresponding to slider value:
                    $scope.currentSignificanceDatapoint = mbbSignificanceCutVals.filter(filter);
                });

                //TODO: initiate this using an ngClick
                $scope.significancePlotPoint = function () {

                    var d = $scope.currentSignificanceDatapoint;

                    //TODO: change the second entry into a number, not string:

                    binding.enter().append("svg:circle")
                        .attr("r", 3)
                        .attr("cx", x(d[0][1]))
                        .attr("cy", y(d[0][1]));

                };
            };

            //initialising significance plot function:
            $scope.significancePlot();
        });
    });
}]);
