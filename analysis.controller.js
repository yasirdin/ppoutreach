ppoutreach.controller('analysisController', ['$scope', '$location', '$timeout', function ($scope, $location, $timeout) {
    //TODO: setup datacutter to append cut value to this object

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //intialising signal/background functions:
    //$scope.dataLoader("hh4", "data/hh4.json", "signal");
    //$scope.dataLoader("ttbar3", "data/ttbar3.json", "background");

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //activating ng-hide when page loads:
    $scope.hideCards = true;

    $scope.go = function(path) {
        $location.path(path);
    };

    //variables titles etc for ng-repeat's.
    $scope.datasets = {
        "hh4": {
            "variables": [
                {name: "mbb"},
                {name: "dr"},
                {name: "hpt"},
                {name: "taupt"}
            ],
            "cutVals" : [
                {"mbb": null},
                {"dr": null},
                {"hpt": null},
                {"taupt": null}
            ]
        },
        "ttbar3": {
            "variables" : [
                {name: "mbb"},
                {name: "dr"},
                {name: "hpt"},
                {name: "taupt"}
            ],
            "cutVals" : [
                {"mbb": null},
                {"dr": null},
                {"hpt": null},
                {"taupt": null}
            ]
        }
    };

    $scope.plotConstants = {
        margin: {top: 10, right: 10, bottom: 30, left: 10},
        width: 1100 - 10 - 10,
        height: 500 - 10 - 30
    };

    //object to store x-y scales for plots for each variable
    $scope.plotScales = {};

    //TODO: make x-y definitions independent for each variable - store on $scope object
    //function for plotting static variable histogram
    $scope.histPlot = function(sliderId, data, histClass, bincount, varName) {

        $scope.histPlotsComplete = true;

        //both sliders have same id attribute, setting min and max values
        d3.selectAll(sliderId)
            .attr("min", d3.min(data))
            .attr("max", d3.max(data))
            .attr("step", "0.001");

        var c = $scope.plotConstants;

        var svg = d3.select(histClass).append("svg")
            .attr("width", c.width + c.margin.left + c.margin.right)
            .attr("height", c.height + c.margin.top + c.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

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

    $scope.cutPlot = function(histClass, data, bincount, varName) {
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

    $scope.sliderCut = function(sliderModel, slider2Model, varName, colNum) {
        $scope.$watchGroup([sliderModel, slider2Model], function(newValues) {
            //slider1 and slider2 values:
            var slider = newValues[0];
            var slider2 = newValues[1];

            //stop slider inputs from overlapping:

            //bypass error message when there when no slider:
            if (!slider && !slider2) { return; }

            //TODO: probably incorrect structure used here, fix:
            $scope.dataCuts[varName] = [];
            $scope.dataCuts[varName].lower = slider;
            $scope.dataCuts[varName].upper = slider2;

            //function for filtering data:
            function cutCheck(entry) {
                if (entry)
                return entry[colNum] >= slider && entry[colNum] <=slider2
            }

            //filtering data:
            $scope.cutMainData = $scope.mainData.filter(cutCheck);
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                        //importing data and calling functions:
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
    
    $scope.onChange = function(dataPath, switchModel) {
        d3.json(dataPath, function (err, data) {
            if (err) {
                throw err;
            }

            if (switchModel == true) {
                $scope.hideCards = false;
            }

            //remove plots when switch is turned off:
            if (switchModel == false) {
                //TODO: fix
                $scope.hideCards = true;
            }


            //checking if plots already exists, if not plot them:
            if ($scope.histPlotsComplete != true) {

                console.log("plotting!");

                $scope.mainData = data;

                //creating function to extract arrays for each variable, put on $scope so reusable elsewhere:
                function varExtract(data, col) {
                    if (data) {
                        return data.map(function (value, index) {
                            return value[col];
                        });
                    }
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
                $scope.histPlot("#tauptSlider", $scope.taupt, ".tauptHist", 50, "taupt");

                //calling function to cut data given slider values:
                $scope.sliderCut("mbbSlider", "mbbSlider2", "mbb", 0);
                $scope.sliderCut("drSlider", "drSlider2", "dr", 1);
                $scope.sliderCut("hptSlider", "hptSlider2", "hpt", 2);
                $scope.sliderCut("tauptSlider", "tauptSlider2","tauput", 3);

                //watching mainData to dynamically adjust variable cut data:
                $scope.$watch('cutMainData', function (data) {
                    $scope.mbbCut = varExtract(data, 0);
                    $scope.drCut = varExtract(data, 1);
                    $scope.hptCut = varExtract(data, 2);
                    $scope.tauptCut = varExtract(data, 3);
                }, true);

                //setting up $watch'ers to plot cutData
                $scope.$watch('mbbCut', function (data) {
                    if (data) {
                        $scope.cutPlot(".mbbHist", data, 50, "mbb");
                    }
                });

                $scope.$watch('drCut', function (data) {
                    if (data) {
                        $scope.cutPlot(".drHist", data, 50, "dr");
                    }
                });

                $scope.$watch('hptCut', function (data) {
                    if (data) {
                        $scope.cutPlot(".hptHist", data, 50, "hpt");
                    }
                });

                $scope.$watch('tauptCut', function (data) {
                    if (data) {
                        $scope.cutPlot(".tauptHist", data, 50, "taupt");
                    }
                });
            }
        });
    };

    //signal, background, signal/background cards:
}]);