ppoutreach.directive('histDirective', [function() {
    function link(scope, element, attr) {
        //constants go here, including initial dataset - outside the $watch:
        var margin = {top: 10, right: 50, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select(element[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var axis = svg.append("g")
            .attr("transform", "translate(0," + height + ")");

        //$watch'ing data in the scope and updating any changes in here:
        scope.$watch('data', function(data){
            if (!data) { return; }

            var x = d3.scaleLinear()
                .domain([d3.min(data), d3.max(data)])
                .rangeRound([0, width]);

            var bincount = 10;

            //cutting input data into nested array of bins
            var bins = d3.histogram()
                .thresholds(x.ticks(bincount))
                (data);

            console.log("Bins:", bins);

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
                .attr("width", function(d) {return x(d.x1) - x(d.x0)})
                .attr("height", function (d) {return height - y(d.length);
                });

            //update axis:
            axis.call(d3.axisBottom(x));

            //removing data elements no longer in the model, to update view
            bar.exit().remove();
        }, true)
    }
    return {
        restrict: 'E',
        link: link,
        scope: {
            data: '='
        }
    }
}]);
