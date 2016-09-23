ppoutreach.controller('analysisController', ['$scope', '$location', function ($scope, $location) {
    //TODO: setup datacutter to append cut value to this object

    // test //

    $scope.demo1 = {
        min: 20,
        max: 80
    };

    // end test //

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

        /*
        //TODO: programmatically add: plot, slider
        var mdcard = d3.select(".main").append("md-card");

        var mdcardTitle = mdcard.append("md-card-title")
            .append("md-card-title-text")
            .append("span").attr("class", "md-headline").text(varName);

        var mdcardContent = mdcard.append("md-card-content");

        var histDiv = mdcardContent.append("div").attr("class", histClass).attr("class", "varHist");
        */
                
        /*
        var newdiv = document.createElement("DIV");
        newdiv.appendChild(document.createTextNode("some text"));
        document.appendChild(newdiv);
        */

        //setting slider limits
        d3.select(sliderId)
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

            //remove plots when switch is turned off:
            if (switchModel == false) {
                var hists = d3.selectAll(".varHist");
                hists.remove("svg");

                /*
                var element = document.getElementsByClassName("varHist");
                //removing child elements:
                element.innerHTML = "";
                */
            }


            //saving data to the scope
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
            $scope.sliderCut("mbbSlider", "mbb", 0);
            $scope.sliderCut("drSlider", "dr", 1);
            $scope.sliderCut("hptSlider", "hpt", 2);
            $scope.sliderCut("tauptSlider", "tauput", 3);

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
        });
    };
}]);