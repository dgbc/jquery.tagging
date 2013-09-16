/* * jQuery plugin for phototagging
 * Requires the autocomplete and imgAreaSelect plugins
 */
 
var values = [];
var targetX1, targetY1, targetX2, targetY2;
var tagCounter = [];
var selector = [];

function repeat(str, n) {
  return new Array( n + 1 ).join( str );
}

function setTagName(index, value) {
    $("#tag-name-"+index).val(value);
}

function submitTag(index, tagging)
{
    tagValue = $("#tag-name-"+index).val();    
    if (tagValue) {
        if(values[index] == undefined){
            tagCounter[index] = 0;
            group = {};
        } else{
            group = values[index];
            tagCounter[index]++;
        }
        
      //Adds a new list item below image. Also adds events inline since they are dynamically created after page load
      if(tagging == 1){
          $("#taglist-"+index).append('<div class="tag-item" id="hotspot-item-'+index+'-'+tagCounter[index]+'"><span class="remove left" onclick="removeTag('+index+','+tagCounter[index]+')" onmouseover="showTag('+index+','+tagCounter[index]+')" onmouseout="hideTag('+index+','+tagCounter[index]+')"></span> <span onmouseover="showTag('+index+','+tagCounter[index]+')" onmouseout="hideTag('+index+','+tagCounter[index]+')">'+tagValue+'</span></div>');
      } else {
          $("#taglist-"+index).append('<div class="tag-item" id="hotspot-item-' + tagCounter[index] + '"><span onmouseover="showTag('+index+','+tagCounter[index]+')" onmouseout="hideTag('+index+','+tagCounter[index]+')">' + tagValue + '</span> </div>');
      }
      //Adds a new hotspot to image
      var width = targetX2-targetX1;
      var height = targetY2-targetY1;
      var left = targetX1;
      var top = targetY1;
      var hotspot_id = 'hotspot-'+index+'-' + tagCounter[index];
      var hotspot_label_id = hotspot_id+'-label';
      $("#tag-wrapper-"+index).append('<div id="'+hotspot_label_id+'" class="hotspot-label">' + tagValue + '</div><div id="' + hotspot_id + '" class="hotspot" style="left:' + left + 'px; top:' + top + 'px; width:'+ width+'px; height:'+height+'px;"></div>');
      hotspot = $("#"+hotspot_id);
      
      hotspot_label = $("#"+hotspot_label_id);
      hotspot.hover(function() {
          $("#"+hotspot_label_id).addClass('hotspothover');
      }, function() {
          $("#"+hotspot_label_id).removeClass('hotspothover');
      });
      offset = hotspot.offset();
      
      $("#"+hotspot_label_id).css({top: hotspot.position().top-hotspot_label.outerHeight()-10, left: (hotspot.position().left - 3) + ((hotspot.outerWidth()/2)-($("#"+hotspot_label_id).outerWidth()/2))})
      //Add to values object


          group[tagCounter[index]] = {'tag':tagValue,
                                    'x1':targetX1/imgWidth,
                                    'y1':targetY1/imgHeight,
                                    'x2':targetX2/imgWidth,
                                    'y2':targetY2/imgHeight};

          values[index] = group;
            if(index == -1){
                //Update form
                $("#id_tags").val(JSON.stringify(values[index]));
            } else {
          //Update form
                $("#id_form-"+index+"-tags").val(JSON.stringify(values[index]));          
          }
      
    }
    if( tagging == 1){
        closeTagInput(index);
    }
}


function closeTagInput(index)
{
    $("#tag-target-"+index).fadeOut();
    $("#tag-input-"+index).fadeOut();
    $("#tag-name-"+index).val("");
    selector[index].setOptions({hide:true});
    
}

function removeTag(index, i)
{
    $("#hotspot-item-"+index+"-"+i).fadeOut();
    $("#hotspot-"+index+"-"+i).fadeOut();
    delete values[index][i];
    // if this isn't set to undefined, the form processing won't work correctly
/*
    if ($.isEmptyObject(values[index])) {
        values.splice(index, 1);
    }
*/
    if(index==-1) {
        $("#id_tags").val(values[index] == undefined ? "" : JSON.stringify(values[index]));
    } else {
        $("#id_form-"+index+"-tags").val(values[index] == undefined ? "" : JSON.stringify(values[index]));
    }
    
}

function removeCategory(index,i)
{
    if(index==-1){
        $("#category-"+i).fadeOut();
        $("#id_category option[value="+i+"]").removeAttr('selected');
    } else {
        $("#category-"+index+"-"+i).fadeOut();
        $("#id_form-"+index+"-category option[value="+i+"]").removeAttr('selected');
    }
    
}


function showTag(index,i)
{
    $("#hotspot-"+index+"-"+i).addClass("hotspothover");
    $("#hotspot-"+index+"-"+i+"-label").addClass("hotspothover");
}

function hideTag(index, i)
{
    $("#hotspot-"+index+"-"+i).removeClass("hotspothover");
    $("#hotspot-"+index+"-"+i+"-label").removeClass("hotspothover");
}


var category_autocomplete_data = [];
var category_tree_html = "";

function prepare_category_tag_data(category_tree){
    if(typeof category_tree == "object"){
        $(category_tree).each(function() {
            var indent = repeat('&nbsp;&nbsp;', this.tree_level);
            if (this.linkable == 1) {
                category_tree_html += '<div class="tag-category" onclick="selectCategory(this);"> ' + indent + '<span class="inner-tag">' + this.title + '</span></div>';
                category_autocomplete_data.push(this.title);
            } else {
                category_tree_html += '<div class="tag-category-unlinkable"> ' + indent + '<span class="inner-tag">' + this.title + '</span></div>';
            }
        });
    }
}

function selectCategory(tag_elem) {
    var input_elem = $(tag_elem).parent().prev().prev()
    input_elem.val($('.inner-tag', tag_elem).text());
}


(function($){  
    $.fn.extend({   
        phototag: function(options) {
            
            var defaults = {
                existing_cats: [],   
                category_tree: [],
                existing_tags: [],
                tagging: 1,
                index: -1,
                load_flag: 0
            };

            var options =  $.extend(defaults, options);
            this.each(function() {
                //alert("applying phototag plugin to: "+this+" with options: "+options);
                var img = $(this);
                img.wrap('<div id="tag-wrapper-'+options.index+'" class="tag-wrapper"></div>');

                if (options.tagging == 1) {
                    $("#tag-wrapper-"+options.index).append('<div id="tag-input-'+options.index+'" class="tag-input"><label for="tag-name-'+options.index+'">Type Category:</label><input type="text" id="tag-name-'+options.index+'"><div>or choose:</div><div id="tag-categories-'+options.index+'" class="tag-categories"></div><button id="tag-submit-btn-'+options.index+'">Submit</button><button type="reset" id="tag-cancel-btn-'+options.index+'">Cancel</button></div>');

                    var tag_container = $("#tag-categories-"+options.index)
                    $(options.existing_cats).each(function() {
                        tag_container.append('<div class="tag-category existing"><span class="inner-tag">'+ this.title + '</span></div>');
                    });
                    tag_container.append(category_tree_html);
                    $("#tag-name-"+options.index).autocomplete(category_autocomplete_data, {matchContains:true,});
                
                    
                    selector[options.index] = img.imgAreaSelect({ instance: true, handles: true, zindex: 1, minHeight: 5, minWidth: 5, onSelectChange: function(img, area) {
                                                                                 imgOffset = $(img).offset();
                                                                                 form_left  = parseInt(area.x1) + parseInt(area.width)+5;
                                                                                 form_top   = parseInt(area.y1);
                                                                                 targetX1 = parseInt(area.x1);
                                                                                 targetY1 = parseInt(area.y1);
                                                                                 targetX2 = parseInt(area.x2);
                                                                                 targetY2 = parseInt(area.y2);
                                                                                 $("#tag-input-"+options.index).css({left:  form_left, top: form_top});
                                                                                 $("#tag-input-"+options.index).show();
                                                                                 $('#tag-input-'+options.index).css("z-index", 10000);
                                                                                 //Give input focus
                                                                                 $("#tag-name-"+options.index).focus();
                                                                             } });
                    selector[options.index].setOptions({hide:true, parent: $("#tag-wrapper-"+options.index)});
                    //If cancel button is clicked
                    $('#tag-cancel-btn-'+options.index).click(function(){
                        closeTagInput(options.index);
                    });
                
                    //If enter button is clicked within #tag-input
                    $("#tag-name-"+options.index).keyup(function(e) {
                        if(e.keyCode == 13) {
                            submitTag(options.index, options.tagging);
                        }
                    });    
                
                    //If submit button is clicked
                    $('#tag-submit-btn-'+options.index).click(function(){
                        submitTag(options.index, options.tagging);
                        return false;
                    });

                } else {
                    $("#tag-wrapper-"+options.index).append('<input type="text" id="tag-name-'+ options.index +'">');
                }

                //wait for image to load entirely before taking height/width
                img.load(function(){
                    if (options.load_flag == 0){
                        imgWidth = img.outerWidth();
                        imgHeight = img.outerHeight();
                        //Dynamically size wrapper div based on image dimensions
                        $("#tag-wrapper-"+options.index).css({width: imgWidth, height: imgHeight});
                        $(options.existing_tags).each(function() {
                            $("#tag-name-"+options.index).val(this.name);
                            targetX1 = this.x1 * imgWidth;
                            targetY1 = this.y1 * imgHeight;
                            targetX2 = this.x2 * imgWidth;
                            targetY2 = this.y2 * imgHeight;
                            submitTag(options.index, options.tagging);
                        });
                        options.load_flag = 1;
                    }
                    
                });
                if(this.complete){
                    $(this).trigger('load');
                }
                
            });  
        }  
    });  
})(jQuery);