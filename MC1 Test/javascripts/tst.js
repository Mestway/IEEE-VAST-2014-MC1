function draw_wiki_table() {
    var filtered_wiki_table = filtered_history_by_time.map(function(d) {
        return [d.time.toLocaleString(), d.author, d.summary];
    });
    // console.log(filtered_wiki_table);

    $('#wiki-view-upper').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="wiki-view-table"></table>' );
    $('#wiki-view-table').dataTable({
        "sScrollY": "370px",
        "bPaginate": true,
        'aaData': filtered_wiki_table,
        // 'iDisplayLength': 10,
        'aoColumns': [
            {
                'sTitle': 'Time',
                'bSortable': false,
            },
            {
                'sTitle': 'Author',
                'bSortable': false,
                // 'sWidth': '100px',
                'mRender': function(d, type, full) {
                    if (type == 'display' && find_node(d) != -1) {
                        var toggle = 'select';
                        if (selected_authors.indexOf(d) != -1) {
                            toggle = 'unselect';
                        }
                        var box_html = d + '<button type="button" id="sel_' + d + '" onclick="toggle_select(this.id)">' + toggle + '</button>';
                        return box_html;
                    } else {
                        return d;
                    }
                }
            },
            // {
            //     'sTitle': 'Minor',
            //     'bSortable': false,
            //     // 'sWidth': '5%',
            //     'sClass': 'center',
            //     'mRender': function(d, type, full) {
            //         if (type == 'display') {
            //             if (d == true) {
            //                 return 'm';
            //             } else {
            //                 return '';
            //             }
            //         } else {
            //             return d;
            //         }
            //     }
            // },
            {
                'sTitle': 'Summary',
                'bSortable': false,
                // 'sWidth': '200px',
            },
        ]
    });
}

function toggle_select(name) {

    function find_dom(name) {
        var ret = 0;
        $('#network-view-svg').find('.network-node, .highlight-network-node').each(function() {
            if ($(this).attr('author') == name) {
                ret = this;
            }
        });
        return ret;
    }
    name = name.replace('sel_', '');
    var dom;
    if (selected_authors.indexOf(name) >= 0) {  // Unselect it
        dom = find_dom(name);
        unselect_node(name, dom);
    } else {            // Select it
        dom = find_dom(name);
        if (dom != 0) {
            select_node(name, dom);
        }
    }
}
