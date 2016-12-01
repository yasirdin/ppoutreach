ppoutreach.controller("analysisTestController", ['$scope', '$location', '$mdDialog', function($scope, $location, $mdDialog) {

    //route redirecting function:
    $scope.go = function(path) {
        $location.path(path);
    };

    //dialogue for finalising cut selection:
    $scope.showDialog = function(ev) {
        $mdDialog.show(
            $mdDialog.alert()
                .textContent('Are you sure you want to finalise this cut selection?')
                .ok('Yes!')
        )
    };

    ////// CONSTANTS //////
    $scope.combinedData = {};

    $scope.plotScales = {};

    $scope.brushCutValues = {};

    $scope.puritySigValues = {};

    $scope.newSelection = {};

    $scope.bincount = 60;

    $scope.plotConstants = {
        margin: {top: 10, right: 40, bottom: 30, left: 40},
        width: 1100 - 40 - 40,
        height: 500 - 10 - 30
    };
    ////// CONSTANTS END ///////

    $scope.varExtract = function(data, col) {
        if (data) {
            return data.map(function (value, index) {
                return value[col];
            });
        }
    };


    ///function for setting x and y scales///:

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

        ///yScale///:
        //finding tallest bin by binning the datasets and using array with largest bin size for yScale:
        var sigBins = d3.histogram()
            .thresholds(x.ticks($scope.bincount))
            (sigData);

        var bgBins = d3.histogram()
            .thresholds(x.ticks($scope.bincount))
            (bgData);

        //acquiring max bin size for each binned array:
        var sigBinMax = d3.max(sigBins, function(d) {
            return d.length;
        });

        var bgBinMax = d3.max(bgBins, function(d) {
            return d.length;
        });

        if (sigBinMax > bgBinMax) {
            var yDomainMax = sigBinMax;
        }
        else {
            var yDomainMax = bgBinMax;
        }

        //setting yScale given above conditions:
        var y = d3.scaleLinear()
            .domain([0, yDomainMax])
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
                return c.height - y(d.length)
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

        //update axis:
        var gAxis = svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + c.height + ")")
            .call(d3.axisBottom(x));

        /// defining cutValsArray: ///
        var cutValsArray = [];

        var stepCount = 15;

        var cutValMin = 0,
            cutValMax = d3.max(scaleData),
            cutValsArrayStep = d3.max(scaleData) / stepCount;

        //appending cutVals to cutValsArray:
        for (i = 0; i < 15; i++) {
            cutValsArray.push((cutValsArrayStep * i).toFixed(2));
        }

        //appending cutVals to $scope object:
        $scope.brushCutValues[varName] = {};
        $scope.brushCutValues[varName].values = [];
        $scope.brushCutValues[varName].values.push(cutValsArray);

        //////d3 brush logic start://///
        var brush = d3.brushX(x)
            .extent([[0, 0], [c.width, c.height]])
            .on("start", start)
            .on("brush", brushed)
            .on("end", end);

        var gBrush = svg.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, [0, d3.max(scaleData) / 2].map(x));

        //making the brush rect non-clickable (non-movable)

        gBrush.select(".selection")
            .style("pointer-events", "none");

        gBrush.select(".overlay")
            .style("pointer-events", "none");

        //disabling left handle of the brush:
        gBrush.selectAll(".handle--w")
            .style("pointer-events", "none");

        //function for rounding current slider value;
        function closest(currentVal, array) {

            var current = array[0];
            var diff = Math.abs(currentVal - current);

            for (i = 0; i < array.length; i++) {
                //checking differences:
                var newDiff = Math.abs(currentVal - array[i]);

                if (newDiff < diff) {
                    diff = newDiff;
                    current = array[i];
                }
            }
            return current;
        }

        //functions for brush:
        function brushed() {
            if (!d3.event.sourceEvent) return;
            if (d3.event.sourceEvent.type === "brush") return;
            if (!d3.event.selection) return;

            //TODO: add some logic which checks if the brush is being moved already:

            //current brush values:
            var currentBrushVals = d3.event.selection.map(x.invert);

            var closestVal = closest(currentBrushVals[1], cutValsArray);

            $scope.newSelection = closestVal;

            //console.log("new selection", $scope.newSelection);
        }

        function end() {
            //insert logic
        }

        function start() {
            //insert logic
        }

        //TODO: add function to reveal and hide scatter plot after the user has attempted to add a few points to the purity and significance plots
        // there will be button option which will enable after the student has attempted a few goes.
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

    $scope.sliderCut = function(sliderModel, data, columnNumber) {
        //set slider limits using $scope.mainData (combined signal and background data):
        //data cutting function:
        $scope.$watch(sliderModel, function(sliderValue) {
            function cutCheck(entry) {
                if (entry)
                    return entry[columnNumber] <= sliderValue;
            }

            console.log(data);
            console.log(sliderValue);

            //filtering data -- applies cuts across all variables:
            $scope.cutMainData = data.filter(cutCheck);

        });

        //cutting data using brush value:

    };

    //PRECOMPUTING PURITY AND SIGNIFICANCE values

    $scope.puritySigCalculator = function(combinedData, sliderVals, varName) {

        var data = combinedData;
        //note: sliderVals are stored inside a JSON object with values for each variable nested within it
        var sliderValsArray = sliderVals.values[0];

        //slider cut vals, purity, significance, in each column respectively:
        $scope.puritySigValues[varName] = [];

        //function for filtering dataset so signal and background events can be counted:
        function cutCheck(entry) {
            if (entry)
                return entry[0] <= sliderVal;
        }

        //function for extracting column from nested array:
        function varExtract(data, col) {
            if (data) {
                return data.map(function (value, index) {
                    return value[col];
                });
            }
        }

        //placeholder arrays to add calculations to:
        var purityArray = [],
            significanceArray = [];

        //given sliderVals and data calculate purity and significance
        //CALCULATING purity:
        for (i = 0; i < sliderValsArray.length; i++) {

            var sliderVal = sliderValsArray[i];

            //1. cut array using filter

            cutArray = data.filter(cutCheck);

            //2. count sig and bg events

            //slicing the signal/background column:
            var sigBgColumn = varExtract(cutArray, 1);

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

            //3. calculate purity and significance given sigcount and bgcount

            //PURITY:
            var purity = sigCount / (sigCount + bgCount) * 100;
            var purity = purity.toFixed(2);
            purityArray.push(purity);

            //SIGNIFICANCE:
            var significance = sigCount / Math.sqrt((sigCount + bgCount) * 100);
            var significance = significance.toFixed(2);
            significanceArray.push(significance);
        }

        for (i = 0; i < sliderValsArray.length; i++) {
            $scope.puritySigValues[varName].push([sliderValsArray[i], purityArray[i], significanceArray[i]]);
        }
    };

    $scope.purityPlot = function(histClass, varName) {

        var c = $scope.plotConstants;

        var svg = d3.select(histClass).append("svg")
            .attr("width", c.width + c.margin.left + c.margin.right)
            .attr("height", c.height + c.margin.top + c.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

        //extracting columns:
        var sliderValsArray = $scope.varExtract($scope.puritySigValues[varName], 0);
        var purityValsArray = $scope.varExtract($scope.puritySigValues[varName], 1);

        var x = d3.scaleLinear()
            .domain([d3.min(sliderValsArray), d3.max(sliderValsArray)])
            .rangeRound([ 0, c.width ]);

        var y = d3.scaleLinear()
            .domain([d3.min(purityValsArray), d3.max(purityValsArray)])
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
            .data($scope.puritySigValues[varName]);

        //TODO: initiate this using an ngClick
        $scope.purityPlotPoint = function() {

            var d = $scope.puritySigValues[varName].filter(function(entry) { return entry[0] == $scope.newSelection});

            console.log(d);

            //TODO: change the second entry into a number, not string:

            binding.enter().append("svg:circle")
                .attr("r", 3)
                .attr("cx", x(d[0][0]))
                .attr("cy", y(d[0][1]));
        };
    };

    $scope.significancePlot = function(histClass, varName) {

        var c = $scope.plotConstants;

        var svg = d3.select(histClass).append("svg")
            .attr("width", c.width + c.margin.left + c.margin.right)
            .attr("height", c.height + c.margin.top + c.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

        //extracting columns:
        var sliderValsArray = $scope.varExtract($scope.puritySigValues[varName], 0);
        var sigValsArray = $scope.varExtract($scope.puritySigValues[varName], 2);

        var x = d3.scaleLinear()
            .domain([d3.min(sliderValsArray), d3.max(sliderValsArray)])
            .rangeRound([ 0, c.width ]);

        var y = d3.scaleLinear()
            .domain([d3.min(sigValsArray), d3.max(sigValsArray)])
            .range([ c.height, 0 ]);


        var xAxis = svg.append("g")
            .attr("transform", "translate(0," + c.height + ")");

        xAxis.call(d3.axisBottom(x));

        var yAxis = svg.append("g")
            .attr("transform", "translate(0, 0)");

        yAxis.call(d3.axisLeft(y));

        //defining group to add points:
        var g = svg.append("g")
            .attr("class", "points");

        var binding =  g.selectAll(".point")
            .data($scope.puritySigValues[varName]);

        //TODO: initiate this using an ngClick
        $scope.significancePlotPoint = function() {

            var d = $scope.puritySigValues[varName].filter(function(entry) { return entry[0] == $scope.newSelection});

            console.log(d);

            //TODO: change the second entry into a number, not string:

            binding.enter().append("svg:circle")
                .attr("r", 3)
                .attr("cx", x(d[0][0]))
                .attr("cy", y(d[0][2]));
        };
    };


    //Note: following function is called using ng-click in the analysis.html:
    $scope.revealPurityPoints = function(varName, purityHistClass) {

        var c = $scope.plotConstants;

        var svg = d3.select(purityHistClass).select("svg").select("g");

        var resultsArray = $scope.puritySigValues[varName];

        //scales://
        var sliderValsArray = $scope.varExtract($scope.puritySigValues[varName], 0);
        var purityValsArray = $scope.varExtract($scope.puritySigValues[varName], 1);

        var x = d3.scaleLinear()
            .domain([d3.min(sliderValsArray), d3.max(sliderValsArray)])
            .rangeRound([ 0, c.width ]);

        var y = d3.scaleLinear()
            .domain([d3.min(purityValsArray), d3.max(purityValsArray)])
            .range([ c.height, 0 ]);
        //scales end//

        //svg group element for points
        var g = svg.append("g");

        var binding =  g.selectAll(".revealpoint")
            .data(resultsArray);

        binding.enter().append("svg:circle")
            .attr("r", 3)
            .attr("cx", function(d) { return x(d[0]) })
            .attr("cy", function(d) { return y(d[1]) });
    };

    //Note: following function is called using ng-click in the analysis.html:
    $scope.revealSigPoints = function(varName, sigHistClass) {

        var c = $scope.plotConstants;

        var svg = d3.select(sigHistClass).select("svg").select("g");

        var resultsArray = $scope.puritySigValues[varName];

        //scales://
        var sliderValsArray = $scope.varExtract($scope.puritySigValues[varName], 0);
        var sigValsArray = $scope.varExtract($scope.puritySigValues[varName], 2);

        var x = d3.scaleLinear()
            .domain([d3.min(sliderValsArray), d3.max(sliderValsArray)])
            .rangeRound([ 0, c.width ]);

        var y = d3.scaleLinear()
            .domain([d3.min(sigValsArray), d3.max(sigValsArray)])
            .range([ c.height, 0 ]);
        //scales end//

        //svg group element for points
        var g = svg.append("g");

        var binding =  g.selectAll(".revealpoint")
            .data(resultsArray);

        binding.enter().append("svg:circle")
            .attr("r", 3)
            .attr("cx", function(d) { return x(d[0]) })
            .attr("cy", function(d) { return y(d[2]) })
    };




    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////LOADING IN DATA AND CALLING FUNCTIONS:///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //signal:
    d3.json("data/hh4.json", function(error, sigData) {
        if (error) { throw error; }

        //background:
        d3.json("data/ttbar3.json", function(error, bgData) {
            if (error) { throw error;}

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

            //plotting static signal over background plot:
            $scope.histPlot($scope.mbbSig, $scope.mbbBg, ".mbbHistSigBg", "mbb");
            //$scope.histPlot($scope.drSig, $scope.drBg, ".drHistSigBg", "dr");
            //$scope.histPlot($scope.hptSig, $scope.hptBg, ".hptHistSigBg", "hpt");
            //$scope.histPlot($scope.tauptSig, $scope.tauptBg, ".tauptHistSigBg", "taupt");

            //combining signal and background datasets:
            $scope.combineData($scope.mbbSig, $scope.mbbBg, "mbb");
            //$scope.combineData($scope.drSig, $scope.drBg, "dr");
            //$scope.combineData($scope.hptSig, $scope.hptBg, "hpt");
            //$scope.combineData($scope.tauptSig, $scope.tauptBg, "taupt");

            $scope.mbbCombinedData = $scope.combinedData["mbb"].data;
            //$scope.drCombinedData = $scope.combinedData["dr"].data;
            //$scope.hptCombinedData = $scope.combinedData["hpt"].data;
            //$scope.tauptCombinedData = $scope.combinedData["taupt"].data;

            //precomputing purity and sig values:
            $scope.puritySigCalculator($scope.mbbCombinedData, $scope.brushCutValues["mbb"], "mbb");
            //$scope.puritySigCalculator($scope.drCombinedData, $scope.brushCutValues["dr"], "dr");

            $scope.purityPlot(".mbbPurityScatter", "mbb");
            //$scope.purityPlot(".drPurityScatter", "dr");

            $scope.significancePlot(".mbbSignificanceScatter", "mbb");




            ///////////////////////////////////////////////////////////


            //combined data stored on $scope.combinedData object:

            /*
            $scope.$watch('sliderModel', function(sliderVal) {
               console.log(sliderVal);
            }, true);
            */


            //plotting purity plots:

            //plotting significance plots:


            //TODO: cutting function for mbb:
            //setting slider limits and cutting function:
            //$scope.sliderCut("#mbbSlider", "mbbSlider", varExtract($scope.mainData, 0), 0);

            //cutting the data:

            /*
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
             .attr("cx", x(d[0][0]))
             .attr("cy", y(d[0][1]));

             };
             };

             //initialising significance plot function:
             $scope.significancePlot();

             //TODO: import in data as json, var extract and plot all of the variables on each tabs

             */
        });
    });
}]);
