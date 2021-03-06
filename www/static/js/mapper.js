/* Copyright (c) 2011 Massachusetts Institute of Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* layout */
var topPane = $('.pane.top');
var leftPane = $('.pane.left');
var rightPane = $('.pane.right');

function setPaneHeights () {
    var extraHeight = $(rightPane).outerHeight(true) - $(rightPane).height();
    $(rightPane).height($(window).height() - $(topPane).outerHeight(true) - extraHeight);
    $(leftPane).height($(rightPane).height());
}

setPaneHeights();
$(window).resize(setPaneHeights);


/* match menu lists  */
var matchers = $('.mapper td.match');

$(matchers).each(function () {
    var openButton = $('.button', this);
    var list = $('.map-list', this);
    $(openButton).click(function (e) {
        if ($(openButton).is('.disabled'))
            return;
 	e.stopPropagation();
	toggle_match_list(list);
    });
});

function open_match_list (mlist) {
    if ($('.map-list-container.open').length)
        return;
    var container = $(mlist).closest('.map-list-container')
    var pos = $(container).prev().offset();
    $(container)
        .addClass('open')
        .css('top', pos.top - 32)
        .css('left', pos.left + 16);
    if (pos.top - 32 + $(container).outerHeight() > $(window).height())
        $(container).css('top', $(window).height() - 280);

    $('.candidate', mlist).click(function () {
        $(this).addClass('selected');
        update_mapping_choice(mlist);
        close_match_list(mlist);
    });

    $(mlist).closest('tr').find('.button').addClass('disabled');

    $(container).click(function (e) {e.stopPropagation();});

    $('body')
	.click( function () {
	    close_match_list(mlist);
	});
}

function close_match_list (mlist) {
    $(mlist).closest('.map-list-container')
        .removeClass('open')
        .css('top', 'auto')
        .css('left', 'auto')
        .closest('tr')
            .find('.button')
                .removeClass('disabled');
}

function toggle_match_list (mlist) {
    if ($(mlist).closest('.map-list-container').is('.open'))
	close_match_list(mlist);
    else
	open_match_list(mlist);
}

function update_mapping_choice (mlist) {
    var choice = $('.selected', mlist);
    var mapping = $(choice).attr('id').split('-to-');
    var fromId = mapping[0];
    var toId = mapping[1];
    var name = $(choice).text();
    var borderColor = $(choice).css('border-left-color');
    var title = $(choice).attr('title');
    var target = $(choice).closest('td').find('.choice');
    $(target)
        .text(name)
        .css('border-left-color', borderColor)
        .attr('id', fromId + '-is-' + toId)
        .attr('title', title);
}

/* match list filters */
$('.map-list-container')
    .find('.filter')
    .children()
    .focus(function () {
        if ($(this).val() === 'Filter')
            $(this).val('');
    })
    .blur(function () {
        if ($(this).val() === '')
            $(this).val('Filter');
    })
    .keyup(function () {
        update_filter(this);
    });

function update_filter (inputEl) {
    var patterns = $(inputEl).val().toLowerCase().split(' ');
    var listElems = $(inputEl).closest('.map-list-container').find('.candidate');
    if (!patterns.length)
        $(listElems).show();
    else
        $(listElems)
            .hide()
            .filter(function () {
                for (var i=0; i<patterns.length; i++)
                    if ($(this).text().toLowerCase().indexOf(patterns[i]) === -1)
                        return false;
                return true;
            })
            .show();
}



/* action buttons */
var actions = $('.actions');
var accept_buttons = $('.accept', actions);
var reject_buttons = $('.reject', actions);
var reset_buttons  = $('.reset',  actions);

$(accept_buttons).each( function () {
    var container = $(this).parent().closest('tr');
    $(this).click( function () {
	$(container)			// This attribute's row (tr)
	    .addClass('mapped')
            .removeClass('unmapped')
            .find('.match')		// The td with the match list
                .find('.button')	// The match list open button
                    .addClass('disabled')
                .end()
	        .find('.choice')	// The chosen match list item
	           .addClass('new-mapping')
	        .end()
	    .end()
	    .find('.status')	// The attributes status cell
	        .text('mapped')
	    .end();
    });
});

$(reject_buttons).each(function () {
    var container = $(this).parent().closest('tr');
    $(this).click( function () {
	var mlist = $(container).find('.map-list');
	$('.selected', mlist)
            .removeClass('selected')
            .next()
                .addClass('selected');
        if (!$('.selected', mlist).length)
            $('.candidate', mlist).first().addClass('selected');
        update_mapping_choice(mlist);
    });
});

$(reset_buttons).each( function () {
    var container = $(this).parent().closest('tr');
    if ($(container).find('.choice.mapping').length)
        return;
    $(this).click( function () {
	$(container)
            .removeClass('mapped')
            .addClass('unmapped')
            .find('.match')
                .find('.button')
                    .removeClass('disabled')
                .end()
	        .find('.choice')
	            .removeClass('new-mapping')
                    .removeClass('mapping')
	        .end()
	    .end()
	    .find('.status')
	        .text('unmapped')
	    .end();
    });
});


/* control panel */
var saveButton = $('.button', topPane).first();
var resetButton = $('.button', topPane).last();

$(resetButton).click(function () {
    $(reset_buttons).click();
});

$(saveButton).click(function () {
    var n=0, mappings = {};
    $('.new-mapping', matchers).each(function () {
	var mapping = $(this).attr('id').split('-is-');
	mappings[mapping[0]] = mapping[1];
        ++n;
    });
    if (n) {
        $.post('./save', mappings, function (d) {
            $('.new-mapping')
                .removeClass('new-mapping')
                .addClass('mapping')
                .removeAttr('style');
	    alert('Saved OK');
        });
    }
});


/* detailed views */
var detail_buttons = $('.detail', actions);

$(detail_buttons).each( function () {
//    var attr_name = encodeURIComponent($(this).closest('tr').children().first().text());
    var fid = $(this).closest('tr').attr('id').slice(3);
    $(this).click( function () {
	fill_popover('./' + fid + '/summary', 600);
    });
});

function open_popover (width) {
    var body = $('body')

    width = width || 600;

    return $('body')
	.append('<div class="dimmer"></div><div class="popover"></div>')
	.find('.dimmer')
	.click( function () {
	    close_popover();
	})
	.end()
	.find('.popover')
	.css('top', ($(window).scrollTop() + 40) + 'px')
	.css('left', ($(window).scrollLeft() + ($(window).width() - width) / 2) + 'px')
	.css('width', width);
}

function close_popover () {
    $('.dimmer').remove();
    $('.popover').remove();
}

function fill_popover (url, width) {
    close_popover();
    var pop = $(open_popover(width));

    $(pop).html('<p>Loading...</p>');
    $.get(url, function (d) {
	$(pop).html(d);
    });

    return $(pop);
}

