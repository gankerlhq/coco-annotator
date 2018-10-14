/**
 * selectTool Functions
 *
 * @author Justin Brooks
 */
define("selectTool", ["paper"], function (paper) {

    return {
        segment: null,
        segmentFound: false,
        movePath: false,
        hitOptions: {
            segments: true,
            stroke: true,
            fill: false,
            class: paper.Path,
            tolerance: 2
        },
        generateStringFromMetadata: function (annotation) {
            let string = " ";
            let metadata = annotation.$refs.metadata.metadataList;

            if (metadata == null || metadata.length === 0) {
                string += "No Metadata\n";
            } else {
                string += "Metadata\n";
                metadata.forEach(element => {
                    if (element.key.length !== 0) {
                        string += ' ' + element.key + ' = ' + element.value + '\n'
                    }
                })
            }


            return string.replace(/\n/g, " \n ").slice(0, -2);
        },
        hoverText: function (hover, category, annotation) {

            if (category == null || annotation == null) return;

            let position = hover.position.add(hover.textShift, 0);

            if (hover.text == null) {
                let content = this.generateStringFromMetadata(annotation);

                hover.text = new paper.PointText(position);
                hover.text.justification = 'left';
                hover.text.fillColor = 'black';
                hover.text.content = content;

                hover.text.fontSize = hover.fontSize;

                hover.box = new paper.Path.Rectangle(hover.text.bounds, 2);

                hover.box.fillColor = 'white';
                hover.box.strokeColor = 'white';
                hover.box.opacity = 0.5;

                hover.box.insertAbove(this.rect);
            }

            hover.shift = (hover.text.bounds.bottomRight.x - hover.text.bounds.bottomLeft.x)/2;
            hover.box.position = position.add(hover.shift, 0);
            hover.text.position = position.add(hover.shift, 0);
            hover.text.bringToFront();
        },
        onMouseUp: function (event) {
        },
        onMouseDown: function (event, canvas, hitOptions) {
            hitOptions = hitOptions || this.hitOptions;
            this.segmentFound = false;
            let hitResult = canvas.project.hitTest(event.point, hitOptions);

            if (!hitResult)
                return;

            if (event.modifiers.shift) {
                if (hitResult.type === 'segment') {
                    hitResult.segment.remove();
                }
                return;
            }

            this.path = hitResult.item;

            if (hitResult.type === 'segment') {
                this.segment = hitResult.segment;
            } else if (hitResult.type === 'stroke') {
                let location = hitResult.location;
                this.segment = this.path.insert(location.index + 1, event.point);
            }
            this.segmentFound = true;
        },

        onMouseDrag: function (event) {
            if (this.segment && this.segmentFound) {
                this.segment.point = event.point;
            }
        },

        onMouseMove: function (event, vue) {
            let canvas = vue.paper;
            let hover = vue.hover;
            let text = vue.hover.text;

            canvas.project.activeLayer.selected = false;

            if (event.item
                && event.item.opacity !== 0
                && event.item.data.hasOwnProperty('categoryId')) {
                let item = event.item;
                hover.category = item.data.categoryId;

                if (item.hasChildren()) {
                    // Find child that contains clicked point
                    for (let i = 0; i < item.children.length; i++) {
                        let child = item.children[i];
                        if (child.opacity !== 0
                            && child.contains(event.point)
                            && child.data.hasOwnProperty('annotationId')) {

                            hover.position = event.point;
                            hover.annotation = child.data.annotationId;
                            child.selected = true;

                            let category = vue.getCategory(hover.category);
                            let annotation = category.getAnnotation(hover.annotation);
                            this.hoverText(hover, category, annotation, hover);

                            break;
                        }
                    }
                }
            } else {
                hover.category = -1;
                hover.annotation = -1;

                if (hover.text != null) {
                    hover.text.remove();
                    hover.box.remove();
                    hover.text = null;
                    hover.box = null;
                }
            }
        },
    };
});