tool_obj =
{
	title: "SITE SETUP",

	navBarElementId: "configure_navbar",
	navbar:
	[
		{title: "Return", icon: "return.png", access: "r", popup: "Return", click: function(){tool_obj.doReturn(tool_obj);}},
		{id: "configure_nav_next", title: "Next", icon: "next.png", iconRight: true, right: true, access: "n", popup: "Configure Next", click: function(){tool_obj.doNext(tool_obj);}},
		{id: "configure_nav_counts", right: true, text: "1 of 1"},
		{id: "configure_nav_prev", title: "Prev", icon: "previous.png", right: true, access: "p", popup: "Configure Previous", click: function(){tool_obj.doPrev(tool_obj);}}
	],

	// this is the site we are working on
	siteId : null,
	siteTitle : null,

	// these get set only from mysites - from a site, these are left null
	returnTo : null,
	siteIds : null,

	datePickerConfig:
	{
		dayNamesMin: ["Sun", "Mon" ,"Tue", "Wed", "Thu", "Fri", "Sat"],
		dateFormat: "M dd, yy",
		showButtonPanel: true,
		changeMonth: true,
		changeYear: true,
		showOn: "both", // "button"
		buttonImage: "support/icons/date.png",
		buttonImageOnly: true
	},

	dateTimePickerConfig:
	{
		dayNamesMin: ["Sun", "Mon" ,"Tue", "Wed", "Thu", "Fri", "Sat"],
		dateFormat: "M dd, yy",
		showButtonPanel: true,
		changeMonth: true,
		changeYear: true,
		showOn: "both", // "button"
		buttonImage: "support/icons/date.png",
		buttonImageOnly: true,
		timeFormat: "hh:mm TT",
		controlType: "select",
		showTime: false,
		closeText: "OK",
		hour: 8,
		minute: 0
	},

	dateTimePicker2Config:
	{
		dayNamesMin: ["Sun", "Mon" ,"Tue", "Wed", "Thu", "Fri", "Sat"],
		dateFormat: "M dd, yy",
		showButtonPanel: true,
		changeMonth: true,
		changeYear: true,
		showOn: "both", // "button"
		buttonImage: "support/icons/date.png",
		buttonImageOnly: true,
		timeFormat: "hh:mm TT",
		controlType: "select",
		showTime: false,
		closeText: "OK",
		hour: 23,
		minute: 59
	},

	start: function(obj, data)
	{
		obj.siteId = data.siteId;

		obj.returnTo = data.returnTo;
		obj.siteIds = data.siteIds;
		
		setTitle(obj.title);

		setupDialog("configure_appearance_dialog", "Done", function(){return obj.saveAppearance(obj);});
		$("#configure_appearance_link").unbind("click").click(function(){obj.configureAppearance(obj);return false;});
		setupDialog("configure_tools_dialog", "Done", function(){return obj.saveTools(obj);});
		$("#configure_tools_link").unbind("click").click(function(){obj.configureTools(obj);return false;});
		setupDialog("configure_links_dialog", "Done", function(){return obj.saveLinks(obj, "fromsitelinks");});
		$("#configure_links_help").unbind("click").click(function(){openAlert("configure_links_helpW");return false;});
		setupDialog("configure_lti_links_dialog", "Done", function(){obj.saveLTILinks(obj); return true;});
		$("#configure_links_link").unbind("click").click(function(){obj.configureLinks(obj);return false;});
		setupDialog("configure_base_date_dialog", "Done", function(){return obj.saveBaseDate(obj);});
		$("#configure_base_date_link").unbind("click").click(function(){obj.configureBaseDate(obj);return false;});
		setupDialog("configure_publication_dialog", "Done", function(){return obj.savePublication(obj);});
		$("#configure_publication_link").unbind("click").click(function(){obj.configurePublication(obj);return false;});
		setupDialog("configure_import_site_dialog", "Continue", function(){return obj.importSelectSite(obj);});
		$("#configure_import_site_link").unbind("click").click(function(){obj.openImportSelectSite(obj);return false;});
		setupDialog("configure_import_tools_dialog", "Import", function(){return obj.importSelectTools(obj);});
		setupAlert("configure_import_alert", function(){return obj.onCloseImportAlert(obj);});
		$("input[name=configure_publication_choice]").unbind('change').change(function(){return obj.publicationChoiceChanged(obj);});
		
		setupDialog("configure_3Party_dialog", "Done", function(){return obj.saveLinks(obj, "from3party");});
		$("#configure_3Party_link").unbind("click").click(function(){obj.configureExternalProviders(obj);return false;});
		$("#configure_3Party_help").unbind("click").click(function(){openAlert("configure_3Party_helpW");return false;});
		$("#configure_3Party_add").unbind("click").click(function(){obj.add3PartyLink(obj, "", "", "","", "");return false;});
		
		$("#configure_upload_package_link").unbind("click").click(function(){obj.openUploadDialog(obj);return false;});
		$("#configure_roster").unbind("click").click(function(){obj.roster(obj);return false;});

		setupDialog("configure_upload_dialog", "Import", function(){return obj.uploadSelectPackage(obj);});
		$("input[name=configure_upload_type_choice]").unbind("change").change(function(){return obj.showHideHartnell(obj);});
		$("input[name=uploadHartnell]").unbind("click").click(function(){return obj.openHartnellWindow(obj);});
		
		// use a direct form for the upload dialog because of the file upload and stupid IE
		setupForm("configure_upload_dialog_form", "configure_uploadToSite", function(response){obj.afterFileUpload(obj, response.config, response.status);});

		setupAlert("configure_upload_alert");
		$("#configure_links_add").unbind("click").click(function(){obj.addSiteLink(obj, "", "", "","", "", false, "600px");return false;});
		setupAlert("configure_links_invalid");
		setupConfirm("configure_confirm_base_date", "Done", function(){obj.doToggleFavorite(obj);});

		startHeartbeat();

		// if we are in a site, disable the link to roster and the site title
		if (obj.returnTo == null)
		{
			$("#configure_roster").addClass("e3_offstage");
			$("#configure_site_title_link").addClass("e3_offstage");
		}

		// if we are from mysites, we enable next/prev, site title and the roster link, assume userSites is loaded (by mysites)
		else
		{
			populateToolNavbar(obj, obj.navBarElementId, obj.navbar);
			$("#configure_roster").unbind("click").click(function(){obj.roster(obj);return false;});
			$("#configure_roster").removeClass("e3_offstage");
			$("#configure_site_title_link").removeClass("e3_offstage");
			
			var site = userSites.find(data.siteId);
			obj.siteTitle = site.title;
			obj.updateSiteTitle(obj, site.title);
			obj.adjustNextPrev(obj);
		}

		obj.loadConfig(obj);
	},

	stop: function(obj, save)
	{
		stopHeartbeat();
	},
	
	done: function()
	{
		closePopup();
	},

	updateSiteTitle: function(obj, title)
	{
		if (obj.returnTo != null)
		{
			$("#configure_site_title_l").html(title).unbind('click').click(function(){selectSite(obj.siteId); return false;});
		}
		else
		{
			$("#configure_site_title_s").html(title);			
		}
	},
 
	doReturn: function(obj)
	{
		var data = new Object();
		data.toolMode = obj.returnTo.toolMode;
		selectStandAloneTool(obj.returnTo.toolId, data);
	},

	doPrev: function(obj)
	{
		// find the prev
		var curPos = obj.siteIds.indexOf(obj.siteId);
		if (curPos == -1)
		{
			curPos = 0;
		}
		else if (curPos > 0)
		{
			curPos--;
		}
		else
		{
			curPos = obj.siteIds.length-1;
		}
		
		var site = userSites.find(obj.siteIds[curPos]);
		obj.siteId = site.siteId;
		obj.siteTitle = site.title;
		obj.updateSiteTitle(obj, site.title);

		populateToolNavbar(obj, obj.navBarElementId, obj.navbar);
		obj.loadConfig(obj);
		obj.adjustNextPrev(obj);
	},

	doNext: function(obj)
	{
		// find the next
		var curPos = obj.siteIds.indexOf(obj.siteId);
		if (curPos == -1)
		{
			curPos = 0;
		}
		else if (curPos == obj.siteIds.length-1)
		{
			curPos = 0;
		}
		else
		{
			curPos++;
		}
		
		var site = userSites.find(obj.siteIds[curPos]);
		obj.siteId = site.siteId;
		obj.siteTitle = site.title;
		obj.updateSiteTitle(obj, site.title);

		populateToolNavbar(obj, obj.navBarElementId, obj.navbar);
		obj.loadConfig(obj);
		obj.adjustNextPrev(obj);
	},
	
	adjustNextPrev: function(obj)
	{
		var curPos = obj.siteIds.indexOf(obj.siteId);
		// to not wrap next and prev
/*			$("#configure_nav_prev").prop('disabled', true).removeClass("e3_hot").addClass("e3_disabled");
			$("#configure_nav_next").prop('disabled', true).removeClass("e3_hot").addClass("e3_disabled");

			if (curPos > 0)
			{
				$("#configure_nav_prev").prop('disabled', false).addClass("e3_hot").removeClass("e3_disabled");
			}
			if (curPos < obj.siteIds.length-1)
			{
				$("#configure_nav_next").prop('disabled', false).addClass("e3_hot").removeClass("e3_disabled");
			}
*/
		$("#configure_nav_counts").html((curPos+1) + " of " + obj.siteIds.length);
	},

	loadConfig: function(obj)
	{
		var params = new Object();
		params.siteId = obj.siteId;
		requestCdp("configure_config", params, function(data)
		{
			obj.config = data.config;
			obj.siteTitle = data.config.title;
			obj.populateConfig(obj, obj.config);
		});
	},

	populateConfig: function(obj, config)
	{
		$("#configure_skin_setting").empty().html(config.skin);

		var skinSample = config.skin;
		if (skinSample.indexOf("-") == -1) skinSample = skinSample.toLowerCase();
		if (skinSample == "etudes") skinSample = "default";
		$("#configure_skin_setting_sample").attr("src", "/library/skin/" + skinSample + "/images/logo_inst.gif");

		var toolList = $("#configure_tools_setting").empty();
		$.each(config.tools, function(index, value)
		{
			var li = $("<li />");
			$(toolList).append(li);
			li.html(value.title);
		});
		
		var baseDateTable = $("#configure_base_date_setting_table tbody").empty();
		$("#configure_base_date_setting").empty();
		if (config.baseDate != undefined)
		{
			$("#configure_base_date_none").addClass("e3_offstage");
			$("#configure_base_date_link").html("Edit");
			$("#configure_base_date_setting").html(config.baseDate);
	
			$.each(config.baseDates, function(index, value)
			{
				var tr = $("<tr />");
				if (value.outRange == 1)
				{
					$(tr).addClass("e3_alert_text");
				}
				$(baseDateTable).append(tr);
				
				createTextTd(tr, value.tool);
				createTextTd(tr, value.range);
			});
		}
		else
		{
			$("#configure_base_date_link").empty();
			$("#configure_base_date_none").removeClass("e3_offstage");
			$("#configure_base_date_setting").html("<i>none</i>");
		}

		if (config.published == 1)
		{
			$("#configure_publication_published").removeClass("e3_offstage");
			$("#configure_publication_unpublished").addClass("e3_offstage");				
			$("#configure_publication_unpublished_willopen").addClass("e3_offstage");				
		}
		else
		{
			$("#configure_publication_published").addClass("e3_offstage");
			if (config.willPublish)
			{
				$("#configure_publication_unpublished_willopen").removeClass("e3_offstage");				
				$("#configure_publication_unpublished").addClass("e3_offstage");
			}
			else
			{
				$("#configure_publication_unpublished").removeClass("e3_offstage");
				$("#configure_publication_unpublished_willopen").addClass("e3_offstage");				
			}
		}

		if (config.pubDate != null)
		{
			$("#configure_publication_publish_on").empty().html(config.pubDate);
		}
		else
		{
			$("#configure_publication_publish_on").empty().html("<i>n/a</i>");
		}
		if (config.unpubDate != null)
		{
			$("#configure_publication_unpublish_on").empty().html(config.unpubDate);
		}
		else
		{
			$("#configure_publication_unpublish_on").empty().html("<i>n/a</i>");
		}
		
		var dl = $("#configure_links_list");
		var d3l = $("#configure_3Party_list");
		$(dl).empty();
		$(d3l).empty();
		$.each(config.links, function(index, value)
		{
			var dt = $("<dt />").html(value.title);
			var dd = $("<dd />").html(value.url);
			if (value.thirdPartyService.match("No"))
			{
				$(dl).append(dt);
				$(dl).append(dd);		
			}
			else
			{
				$(d3l).append(dt);
				$(d3l).append(dd);
			}
		});
	
		adjustForNewHeight();
	},

	configureAppearance: function(obj)
	{
		$('input:radio[name=configure_edit_skin_choice][value="' + obj.config.skin + '"]').prop('checked', true);

		// disable all client skin choices
		$("*.configure_edit_skin_inst").addClass("e3_offstage");

		// isolate the prefix from the site title
		var index = obj.siteTitle.indexOf(" ");
		if (index != -1)
		{
			var prefix = obj.siteTitle.substr(0,index);
			// enable this skin choise
			$("#" + prefix).removeClass("e3_offstage");
		}

		$("#configure_appearance_dialog").dialog('open');
	},

	saveAppearance: function(obj)
	{
		var params = new Object();
		params.siteId = obj.siteId;
		params.skin = $('input:radio[name=configure_edit_skin_choice]:checked').val();
		requestCdp("configure_setConfig", params, function(data)
		{
			if (obj.returnTo != null)
			{
				obj.config = data.config;
				obj.populateConfig(obj, obj.config);
			}
			else
			{
				resetPortal();
			}
		});
		return true;
	},

	configureTools: function(obj)
	{
		$('input:checkbox[name=configure_tools_choice]').prop('checked',false);
		$.each(obj.config.tools, function(index, value)
		{
			$('input:checkbox[name=configure_tools_choice][value="' + value.toolId + '"]').prop('checked',true);
		});
		
		$("#configure_tools_dialog").dialog('open');
	},

	saveTools: function(obj)
	{
		var params = new Object();
		params.siteId = obj.siteId;		
		params.tools = "";
		$.each($("input[name=configure_tools_choice]:checked"), function(index, value)
		{
			params.tools = params.tools + $(value).val() + ",";
		});
		if (params.tools.length > 0) params.tools = params.tools.substring(0, params.tools.length-1);

		requestCdp("configure_setConfig", params, function(data)
		{
			if (obj.returnTo != null)
			{
				obj.config = data.config;
				obj.populateConfig(obj, obj.config);
			}
			else
			{
				resetPortal();
			}
		});
		return true;
	},

	configureLinks: function(obj)
	{
		$("#configure_links_table tbody").empty();
		var count = 0;
		$.each(obj.config.links, function(index, value)
		{
			if (value.thirdPartyService.match("No"))
			{
				count = count + 1;
				obj.addSiteLink(obj, value.title, value.url, value.key, value.secret, value.extraInformation,(value.popup == "1"), value.height);
			}
		});
		if (count == 0) obj.addSiteLink(obj, "", "", "", "", "", false, "600px");

		$("#configure_links_table tbody").sortable({axis:"y", containment:"#configure_links_table tbody", handle:".e3_reorder", tolerance:"pointer"});
		$("#configure_links_dialog").dialog('open');
	},

	setupLinksEditKbd : function(obj, fromSection)
	{
		$('*.configure_links_row').unbind("keydown").keydown(function(event)
		{
			if (event.target == event.currentTarget)
			{
				// arrow up
				if (event.which == 38)
				{
					var prev = $(event.currentTarget).prev('tr')[0];
					if (prev != null) $(event.currentTarget).insertBefore(prev);
					$(event.currentTarget).focus();
					return false;
				}
				// arrow down
				else if (event.which == 40)
				{
					var next = $(event.currentTarget).next('tr')[0];
					if (next != null) $(event.currentTarget).insertAfter(next);
					$(event.currentTarget).focus();
					return false;
				}
				// delete
				else if (event.which == 8)
				{
					obj.deleteSiteLink(obj, event.currentTarget, fromSection);
					return false;
				}
			}
			return true;
		});
		
		$('*.configure_links_row').unbind("focus").focus(function(event)
		{
			$(this).addClass("e3_kbd_selected");
			return true;
		});

		$('*.configure_links_row').unbind("blur").blur(function(event)
		{
			$(this).removeClass("e3_kbd_selected");
			return true;
		});
	},

	deleteSiteLink: function(obj, target, fromSection)
	{
		var prev = $(target).prev('tr')[0];
		var next = $(target).next('tr')[0];

		$(target).remove();
	
		if (prev != null)
		{
			$(prev).focus();
		}
		else if (next != null)
		{
			$(next).focus();
		}
		else
		{
			if (fromSection.match("fromsitelinks"))
			{
				var tr = obj.addSiteLink(obj, "", "", "", "", "", false, "600px");
				$(tr).focus();
			}
			if (fromSection.match("from3party"))
			{
				var tr = obj.add3PartyLink(obj, "", "", "", "", "");
				$(tr).focus();
			}
		}
	},

	addSiteLink: function(obj, title, url, key, secret, extraInformation, popup, height)
	{
		var tr = $("<tr />");
		$(tr).attr("tabindex", 0).addClass("configure_links_row");
			
		$("#configure_links_table tbody").append(tr);
		
		var td = createTextEditTd(tr, title, 20, null, null);
		$(td).addClass("configure_links_titles");

		td = createTextEditTd(tr, url, 40, null, null);
		$(td).addClass("configure_links_urls");
		
		td = createCheckboxTd(tr, popup, null, null, 10);
		$(td).addClass("configure_links_popups");

		td = createTextEditTd(tr, height, 10, null, null);
		$(td).addClass("configure_links_heights");
			
		var ltiImage = "lti-add.png";		
		if (key != undefined && key.length > 0 && secret != undefined && secret.length > 0)
			ltiImage = "lti-info.png";
			
		td = createIconTd(tr, ltiImage, "LTI", function(){obj.addEditLTILink(obj, $(this)); return false;});
		$(td).addClass("configure_links_lti");
		$(td).attr("key", key);
		$(td).attr("secret", secret);
		$(td).attr("extraInformation", extraInformation);
		$(td).attr("thirdPartyService", "No");
	
		createIconTd(tr, "delete.png", "delete", function(){obj.deleteSiteLink(obj, $(this).parent(), "fromsitelinks"); return false;});
		createReorderIconTd(tr);
		obj.setupLinksEditKbd(obj, "fromsitelinks");
		return tr;
	},
	
	addEditLTILink: function (obj, t)
	{	
		$("#configure_lti_links_table tbody").empty();
		var tr = $("<tr />");
		$(tr).addClass("e3_edit_set_row");
		$("#configure_lti_links_table tbody").append(tr);
		createLabelTd(tr, "Key: ", null).addClass("e3_edit_set_entry_header");
		createTextEditTd(tr, t.attr('key'), 20, "lti_key", null).addClass("e3_edit_set_entry_field");
		
		var tr2 = $("<tr />");
		$(tr2).addClass("e3_edit_set_row");
		$("#configure_lti_links_table tbody").append(tr2);
		createLabelTd(tr2, "Secret: ", null).addClass("e3_edit_set_entry_header");
		createTextEditTd(tr2, t.attr('secret'), 20, "lti_secret", null).addClass("e3_edit_set_entry_field");	
		
		var tr3 = $("<tr />");
		$(tr3).addClass("e3_edit_set_row");
		$("#configure_lti_links_table tbody").append(tr3);
		createLabelTd(tr3, "Custom Parameters: <br> (Optional)", null).addClass("e3_edit_set_entry_header e3_edit_header_top_align");
		createTextareaEditTd(tr3, t.attr('extraInformation'), 3, 40, "lti_extra", null).addClass("e3_edit_set_entry_field");	

		var tr4 = $("<tr />");
		$(tr4).addClass("e3_edit_set_row");
		$("#configure_lti_links_table tbody").append(tr4);
		createLabelTd(tr4, "", null).addClass("e3_edit_set_entry_header");
		createLabelTd(tr4, "For multiple custom parameters, enter them one per line.", null).addClass("e3_dialog_instructions");
		createTextEditTd(tr4, t.attr('thirdPartyService'), 3, "lti_service", null).addClass("e3_edit_set_entry_field e3_offstage");	
				
		$("#configure_lti_links_dialog").data('opener', t).dialog('open');
		return true;
	},

	validateLinks: function(obj)
	{
		var valid = true;
		var titles = $(".configure_links_titles input");
		var urls = $(".configure_links_urls input");
		for (var i=0; i<titles.length; i++)
		{
			var title = $.trim($(titles[i]).val());
			var url = $.trim($(urls[i]).val());
			if (!((title.length == 0) && (url.length == 0)))
			{
				if (title.length == 0) valid = false;
				if (url.length == 0) valid = false;
			}
		}

		return valid;
	},
	
	saveLTILinks : function(obj)
	{
		var o = $("#configure_lti_links_dialog").data("opener");
		if (o != undefined)
		{
			o.attr("key", $.trim($("#lti_key").val()));
			o.attr("secret", $.trim($("#lti_secret").val()));
			o.attr("extraInformation", $.trim($("#lti_extra").val()));
			o.attr("thirdPartyService", $.trim($("#lti_service").val()));
		}
		return true;
	},
	
	saveLinks: function(obj, fromSection)
	{
		if (!obj.validateLinks(obj))
		{
			$("#configure_links_invalid").dialog("open");
			return false;
		}

		var titles = $(".configure_links_titles input");
		var urls = $(".configure_links_urls input");
		var popups = $(".configure_links_popups input");
		var heights = $(".configure_links_heights input");
		var ltis = $(".configure_links_lti");
		
		var params = new Object();
		params.siteId = obj.siteId;
		params.from3party = fromSection;
		params.linksCount = titles.length.toString();
		for (var i = 0; i < titles.length; i++)
		{
			params["title"+i] = $.trim($(titles[i]).val());
			params["url"+i] = $.trim($(urls[i]).val());
			params["popup"+i] = $(popups[i]).attr("checked") ? "1" : "0";
			params["height"+i] = $.trim($(heights[i]).val());
			params["key"+i] = $.trim($(ltis[i]).attr("key"));
			params["secret"+i] = $.trim($(ltis[i]).attr("secret"));
			params["extraInformation"+i] = $.trim($(ltis[i]).attr("extraInformation"));
			params["thirdPartyService"+i] = $.trim($(ltis[i]).attr("thirdPartyService"));
		}
	
		requestCdp("configure_setConfig", params, function(data)
		{	
			if (obj.returnTo != null)
			{				
				obj.config = data.config;
				obj.populateConfig(obj, obj.config);
			}
			else
			{
				resetPortal();
			}
		});

		return true;
	},
	
	configureExternalProviders: function(obj)
	{
		$("#configure_3Party_table tbody").empty();
		var countExternal = 0;
		$.each(obj.config.links, function(index, value)
		{
			if (value.thirdPartyService.match("Yes"))
			{
				countExternal = countExternal + 1;
				obj.add3PartyLink(obj, value.title, value.url, value.key, value.secret, value.extraInformation);
			}
		});
		if (countExternal == 0) obj.add3PartyLink(obj, "", "", "", "", "");
		$("#configure_3Party_dialog").dialog('open');
	},
	add3PartyLink: function(obj, title, url, key, secret, extraInformation)
	{
		var tr = $("<tr />");
		$(tr).attr("tabindex", 0).addClass("configure_links_row");
			
		$("#configure_3Party_table tbody").append(tr);
		
		var td = createTextEditTd(tr, title, 20, null, null);
		$(td).addClass("configure_links_titles");

		td = createTextEditTd(tr, url, 40, null, null);
		$(td).addClass("configure_links_urls");
		
		var ltiImage = "lti-add.png";		
		if (key != undefined && key.length > 0 && secret != undefined && secret.length > 0)
			ltiImage = "lti-info.png";
			
		td = createIconTd(tr, ltiImage, "LTI", function(){obj.addEditLTILink(obj, $(this)); return false;});
		$(td).addClass("configure_links_lti");
		$(td).attr("key", key);
		$(td).attr("secret", secret);
		$(td).attr("extraInformation", extraInformation);
		$(td).attr("thirdPartyService", "Yes");
		createIconTd(tr, "delete.png", "delete", function(){obj.deleteSiteLink(obj, $(this).parent(), "from3party"); return false;});
		obj.setupLinksEditKbd(obj, "from3party");
		return tr;
	},
	configureBaseDate: function(obj)
	{
		$("#configure_base_date_missing_alert").addClass("e3_offstage");
		$("#configure_base_date_range_alert").addClass("e3_offstage");
		$("#configure_base_date_value").val("");
		$("#configure_base_date_value").datepicker("destroy");
		$("#configure_base_date_value").datepicker(obj.datePickerConfig);

		$("#configure_base_date_dialog_base_date").empty().html(obj.config.baseDate);
		
		$('#configure_base_date_value').unbind('change').change(function(){obj.adjustNewBaseDatesDisplay(obj);return true;});

		var needAlert = false;
		$("#configure_base_date_table tbody").empty();
		$.each(obj.config.baseDates, function(index, value)
		{
			var tr = $("<tr />");
			if (value.outRange == 1)
			{
				$(tr).addClass("e3_alert_text");
				needAlert = true;
			}
			$("#configure_base_date_table tbody").append(tr);

			createTextTd(tr, value.tool);
			createTextTd(tr, value.range);
			var td = createTextTd(tr, value.range);
			$(td).addClass("config_base_date_new");
			if (value.range.indexOf(" - ") != -1)
			{
				var from = value.range.substring(0, value.range.indexOf(" - "));
				var to = value.range.substring(value.range.indexOf(" - ")+3);
				$(td).attr("origFrom", from);
				$(td).attr("origTo", to);
			}
			else
			{
				$(td).attr("origFrom", value.range);
			}
		});

		if (needAlert)
		{
			$("#configure_base_date_range_alert").removeClass("e3_offstage");
		}

		$("#configure_base_date_dialog").dialog('open');
	},

	adjustNewBaseDatesDisplay: function(obj)
	{
		var newDate = $.trim($("#configure_base_date_value").val());
		var newBaseMoment = moment(newDate, "MMM DD, YYYY");
		var oldBaseMoment = moment(obj.config.baseDate, "MMM DD, YYYY");
		var daysDiff = newBaseMoment.diff(oldBaseMoment, "days");
		
		$.each($(".config_base_date_new"), function(index, value)
		{
			var origFrom = $(value).attr("origFrom");
			var origTo = $(value).attr("origTo");

			var origFromM = moment(origFrom, "MMM DD, YYYY");
			origFromM.add("d", daysDiff);

			var newDisplay = null;
			if (origTo != undefined)
			{
				var origToM = moment(origTo, "MMM DD, YYYY");
				origToM.add("d", daysDiff);

				newDisplay = origFromM.format("MMM DD, YYYY") + " - " + origToM.format("MMM DD, YYYY");
				$(value).html(newDisplay);
			}
			else
			{
				newDisplay = origFromM.format("MMM DD, YYYY");
			}
			$(value).html(newDisplay);
		});
	},

	saveBaseDate: function(obj)
	{
		// get the new base date
		var newDate = $.trim($("#configure_base_date_value").val());
		if (newDate.length == 0)
		{
			$("#configure_base_date_missing_alert").removeClass("e3_offstage");
			return false;
		}

		var params = new Object();
		params.siteId = obj.siteId;
		params.baseDate = newDate;

		requestCdp("configure_setConfig", params, function(data)
		{
			obj.config = data.config;
			obj.populateConfig(obj, obj.config);
		});

		return true;
	},

	configurePublication: function(obj)
	{
		$('input:radio[name=configure_publication_choice]').prop('checked', false);
		$("#configure_publication_schedule_publish").val("");
		$("#configure_publication_schedule_unpublish").val("");
		$("#configure_publication_section_schedule").addClass("e3_offstage");
		$("#configure_publication_option_alert").addClass("e3_offstage");
		$("#configure_publication_dates_alert").addClass("e3_offstage");

		var publishValue ="publish";
		if (obj.config.pubDate != null || obj.config.unpubDate != null)
		{
			publishValue = "setdates";
		}
		else if (obj.config.published == 0)
		{
			publishValue = "unpublish";
		}
		$('input:radio[name=configure_publication_choice][value="' + publishValue + '"]').prop('checked', true);
		obj.publicationChoiceChanged(obj);

		$("#configure_publication_schedule_publish").datetimepicker("destroy");
		$("#configure_publication_schedule_unpublish").datetimepicker("destroy");
		$("#configure_publication_schedule_publish").datetimepicker(obj.dateTimePickerConfig);
		$("#configure_publication_schedule_unpublish").datetimepicker(obj.dateTimePicker2Config);
		
		if (obj.config.pubDate != null) $("#configure_publication_schedule_publish").datetimepicker("setDate", obj.config.pubDate);
		if (obj.config.unpubDate != null) $("#configure_publication_schedule_unpublish").datetimepicker("setDate", obj.config.unpubDate);

		$("#configure_publication_dialog").dialog('open');
	},

	savePublication: function(obj)
	{
		// validate
		if ($('input:radio[name=configure_publication_choice]:checked').length == 0)
		{
			$("#configure_publication_option_alert").removeClass("e3_offstage");
			return false;			
		}
		if ($('input:radio[name=configure_publication_choice]:checked').val() == "setdates")
		{
			if (($("#configure_publication_schedule_publish").val().length == 0) && ($("#configure_publication_schedule_unpublish").val().length == 0))
			{
				$("#configure_publication_dates_alert").removeClass("e3_offstage");
				return false;			
			}
		}

		var params = new Object();
		params.siteId = obj.siteId;
		params.publish = $('input:radio[name=configure_publication_choice]:checked').val();
		if (params.publish == "setdates")
		{
			params.pubDate = $("#configure_publication_schedule_publish").val();
			params.unpubDate = $("#configure_publication_schedule_unpublish").val();
		}

		requestCdp("configure_setConfig", params, function(data)
		{
			if (obj.returnTo != null)
			{
				obj.config = data.config;
				obj.populateConfig(obj, obj.config);
			}
			else
			{
				resetPortal();
			}
		});

		return true;
	},

	publicationChoiceChanged: function(obj)
	{
		// if the value is now "setdates"
		if ("setdates" == $("input[name=configure_publication_choice]:checked").val())
		{
			$("#configure_publication_section_schedule").removeClass("e3_offstage");
		}
		else
		{
			$("#configure_publication_section_schedule").addClass("e3_offstage");
		}
	},

	openImportSelectSite: function(obj)
	{
		var params = new Object();
		params.siteId = obj.siteId;
		requestCdp("configure_importSites", params, function(data)
		{
			$("#configure_importSites_table tbody").empty();
			$("#configure_importSites_noSites").addClass("offstage");

			var any = false;
			if (data.sites != null)
			{
				var splitSites = obj.splitSites(obj, data.sites);
				$.each(splitSites, function(index, value)
				{
					any = true;

					var tr = $("<tr />");
					$("#configure_importSites_table tbody").append(tr);
					
					// header?
					if ($.type(value.left) === "string")
					{
						createHeaderTd(tr, value.left, 4);
						
						// we need a new row!
						tr = $("<tr />");
						$("#configure_importSites_table tbody").append(tr);					
					}
					
					// otherwise one or two sites
					else
					{
						// left
						createSelectRadioLableTds(tr, "configure_import_site_choice_"+value.left.siteId, "configure_import_site_choice", value.left.siteId, value.left.title);
						
						// right
						if (value.right != null)
						{
							createSelectRadioLableTds(tr, "configure_import_site_choice_"+value.right.siteId, "configure_import_site_choice", value.right.siteId, value.right.title);
						}
						else
						{
							createTextTd(tr, "");
							createTextTd(tr, "");
						}
					}
				});
			}

			if (!any)
			{
				$("#configure_importSites_noSites").removeClass("offstage");
			}
	
			$("input[name=configure_import_site_choice]").unbind('change').change(function(){return obj.importSiteChoiceChanged(obj);});
			$("#configure_import_site_dialog").dialog('open');
		});
	},

	// into two cols, left  to right, with headers in the left for new terms (and the right for those empty)
	splitSites: function(obj, sites)
	{
		var rv = new Array();
		
		for (var i = 0; i < sites.length; i++)
		{
			// inject header for a term change
			if (((i > 0) && (sites[i-1].term != sites[i].term)) || (i == 0))
			{
				var entry = {};
				entry.left = sites[i].term;
				entry.right = null;
				rv.push(entry);
			}
			
			var entry = {};
			entry.left = sites[i];
			entry.right = null;
			// do the right only if it matches the term of the left
			if ((i+1 < sites.length) && (sites[i+1].term == sites[i].term))
			{
				i++;
				entry.right = sites[i];
			}
			rv.push(entry);
		}

		return rv;
	},

	importSiteChoiceChanged: function(obj)
	{
		$("#configure_import_site_alert").addClass("e3_offstage");
	},

	importSiteId: null,

	importSelectSite: function(obj)
	{
		obj.importSiteId = $("input[name=configure_import_site_choice]:checked").val();
		if (obj.importSiteId == null)
		{
			$("#configure_import_site_alert").removeClass("e3_offstage");
			return false;
		}

		var siteTitle = $("input[name=configure_import_site_choice]:checked").attr("label");
		$("#configure_import_site_title").empty().html(siteTitle);

		var params = new Object();
		params.siteId = obj.importSiteId;
		requestCdp("configure_importSiteTools", params, function(data)
		{			
			$("#configure_importSiteTools_table tbody").empty();

			// all - now placed into the html
//			var tr = $("<tr />");
//			$("#configure_importSiteTools_table tbody").append(tr);
//			createSelectCheckboxLableTds(tr, "configure_import_tools_choice_all", "configure_import_tools_choice", "all", "All");

			if (data.tools != null)
			{
				$.each(data.tools, function(index, value)
				{
					var tr = $("<tr />");
					$("#configure_importSiteTools_table tbody").append(tr);
					createSelectCheckboxLableTds(tr, "configure_import_tools_choice_"+value.toolId, "configure_import_tools_choice", value.toolId, obj.toolTitle(value.toolId));
				});
			}

			$("input[name=configure_import_tools_choice]").unbind('change').change(function(){return obj.importToolsChoiceChanged(obj);});
			$("input[name=configure_import_tools_choice][value=all]").unbind('change').change(function(){return obj.importToolsAllChanged(obj);});
			$("#configure_import_tools_alert").addClass("e3_offstage");
			$("input[name=configure_import_tools_choice]").prop("checked", true);
			$("#configure_import_tools_dialog").dialog('open');
		});

		return true;
	},

	toolTitle: function(toolId)
	{
		if (toolId == "sakai.announcements") return "Announcements";
		if (toolId == "sakai.chat") return "Chat";
		if (toolId == "sakai.mneme") return "Assignments, Tests & Surveys";
		if (toolId == "sakai.coursemap") return "Course Map";
		if (toolId == "sakai.jforum.tool") return "Discussion and Private Messages";
		if (toolId == "sakai.gradebook.tool") return "Gradebook";
		if (toolId == "sakai.melete") return "Modules";
		if (toolId == "sakai.resources") return "Resources";
		if (toolId == "sakai.schedule") return "Schedule";
		if (toolId == "sakai.siteinfo") return "Site Info";
		if (toolId == "sakai.syllabus") return "Syllabus";
		if (toolId == "sakai.iframe") return "Site Links";
		if (toolId == "e3.homepage") return "Home";
		if (toolId == "e3.configure") return "Site Setup";
		if (toolId == "e3.siteroster") return "Roster (Groups)";
		if (toolId == "e3.gradebook") return "Gradebook";
		return "?";
	},

	importToolsChoiceChanged: function(obj)
	{
		// clear if something is selected
		if ($("input[name=configure_import_tools_choice]:checked").val() != null)
		{
			$("#configure_import_tools_alert").addClass("e3_offstage");
		}

		var uncheckedCount = $("input[name=configure_import_tools_choice]:unchecked").length;
		var allChecked = $("input[name=configure_import_tools_choice][value=all]").prop("checked");

		// if nothing but all unchecked, check all
		if ((uncheckedCount == 1) && (!allChecked))
		{
			$("input[name=configure_import_tools_choice][value=all]").prop("checked", true);
		}
		// else if not everything is selected, clear all
		else if (uncheckedCount > 0)
		{
			$("input[name=configure_import_tools_choice][value=all]").prop("checked", false);
		}
	},

	importToolsAllChanged: function(obj)
	{
		// clear all if any are unchecked
		var uncheckedCount = $("input[name=configure_import_tools_choice]:unchecked").length;
		var allChecked = $("input[name=configure_import_tools_choice][value=all]").prop("checked");

		// if now checked, check all else
		if (allChecked)
		{
			$("input[name=configure_import_tools_choice]").prop("checked", true);
			$("#configure_import_tools_alert").addClass("e3_offstage");
		}
		// else, if all is not checked, and was just changed, and there are no other unchecked, clear everything
		else if (uncheckedCount == 1)
		{
			$("input[name=configure_import_tools_choice]").prop("checked", false);
		}
	},

	importTools: null,

	importSelectTools: function(obj)
	{
		obj.importTools = new Array();
		var tools = "";
		var allChecked = $("input[name=configure_import_tools_choice][value=all]").prop("checked");
		if (allChecked)
		{
			obj.importTools.push("all");
			tools = "All";
		}
		else
		{
			$.each($("input[name=configure_import_tools_choice]:checked"), function(index, value)
			{
				obj.importTools.push($(value).val());
				tools = tools + $(value).attr("label") + "<br />";
			});
		}

		if (obj.importTools.length == 0)
		{
			$("#configure_import_tools_alert").removeClass("e3_offstage");
			return false;
		}

		$("#configure_import_tools").empty().html(tools);

		obj.doSiteImport(obj);
		return true;
	},

	doSiteImport: function(obj)
	{
		// do the import!
		var params = new Object();
		params.siteId = obj.siteId;
		params.tools = "";
		$.each(obj.importTools, function(index, value)
		{
			params.tools = params.tools + value + "\t";
		});
		params.fromSiteId = obj.importSiteId;
		requestCdp("configure_importFromSite", params, function(data)
		{
			$("#configure_import_progress").addClass("e3_offstage");
			$("#configure_import_done").removeClass("e3_offstage");
			if ($("#configure_import_alert").dialog('isOpen') == false)
			{
				$("#configure_import_alert").dialog('open');
			}
			
			if (obj.returnTo != null)
			{
				obj.config = data.config;
				obj.populateConfig(obj, obj.config);
			}
		});

		$("#configure_import_progress").removeClass("e3_offstage");
		$("#configure_import_done").addClass("e3_offstage");

		$("#configure_import_alert").dialog('open');
	},
	
	onCloseImportAlert: function(obj)
	{
		if (obj.returnTo == null)
		{
			resetPortal();
		}
	},

	uploadType : null,
	uploadFile : null,

	openUploadDialog: function(obj)
	{
		$("input[name=configure_upload_type_choice]:checked").prop("checked", false);
		$("#configure_upload_file").val(null);
		$("#configure_upload_type_alert").addClass("e3_offstage");
		$("#configure_upload_file_alert").addClass("e3_offstage");
		$("#configure_ecollege_file").addClass("e3_offstage");
		$("#configure_upload_dialog").dialog('open');
	},
	
	showHideHartnell: function(obj)
	{
		if ("ecollege" == $("input[name=configure_upload_type_choice]:checked").val())
		{
			if (obj.siteTitle.startsWith("HC")) 
				$("#configure_ecollege_file").removeClass("e3_offstage");
			else
				$("#configure_ecollege_file").addClass("e3_offstage");
		}
		else
		{
			$("#configure_ecollege_file").addClass("e3_offstage");
		}
	},
	
	openHartnellWindow: function(obj)
	{			
		var _info = navigator.userAgent;
		var _ie = (_info.indexOf("MSIE") > 0 && _info.indexOf("Win") > 0 && _info.indexOf("Windows 3.1") < 0);
		var windowDefaults = "status=no, menubar=no, location=no, scrollbars=yes, resizeable=yes, width=auto, height=400";
		var newWindow;
		if(!_ie) newWindow = window.open('/eCollegeSelector/filelist.jsp','Select file',windowDefaults);
		else newWindow = window.open('/eCollegeSelector/filelist.jsp',null,windowDefaults);
		if (window.focus) { newWindow.focus(); } ; // force the window to the front if the browser supports it
		return newWindow;		
	},
	
	uploadSelectPackage: function(obj)
	{
		obj.uploadType = $("input[name=configure_upload_type_choice]:checked").val();
		if (obj.uploadType == null)
		{
			$("#configure_upload_type_alert").removeClass("e3_offstage");
			return false;
		}

		obj.uploadFile = $.trim($("#configure_upload_file").val());
		var selectedFile = $.trim($("#configure_upload_dialog_form_selectedfile").val());
		if (obj.uploadFile.length == 0 && selectedFile.length == 0)
		{
			$("#configure_upload_file_alert").removeClass("e3_offstage");
			return false;
		}

		obj.openUploadAlert(obj);
		return true;
	},

	openUploadAlert: function(obj)
	{
		// do the import!
		// setup params into the form
		$("#configure_upload_dialog_form_siteId").val(obj.siteId);
		$("#configure_upload_dialog_form_uploadType").val(obj.uploadType);

		// directly submit the form
		$("#configure_upload_dialog_form").submit();

//		var params = new Object();
//		params.siteId = obj.siteId;
//		params.uploadType = obj.uploadType;
//		// file ???
//		requestCdp("configure_uploadToSite", params, function(data)
//		{
//			$("#configure_upload_progress").addClass("e3_offstage");
//			$("#configure_upload_done").removeClass("e3_offstage");
//			if ($("#configure_upload_alert").dialog('isOpen') == false)
//			{
//				$("#configure_upload_alert").dialog('open');
//			}
//
//			obj.config = data.config;
//			obj.populateConfig(obj, obj.config);
//		});

		$("#configure_upload_progress").removeClass("e3_offstage");
		$("#configure_upload_done").addClass("e3_offstage");
		$("#configure_upload_status").empty();
		$("#configure_upload_alert").dialog('open');
	},

	afterFileUpload: function(obj, config, status)
	{
		$("#configure_upload_progress").addClass("e3_offstage");
		$("#configure_upload_done").removeClass("e3_offstage");
		$("#configure_upload_status").empty().html(status);
		if ($("#configure_upload_alert").dialog('isOpen') == false)
		{
			$("#configure_upload_alert").dialog('open');
		}
		
		obj.config = config;
		obj.populateConfig(obj, obj.config);
	},

	roster: function(obj)
	{
		var data = new Object();
		data.siteIds = obj.siteIds;
		data.siteId = obj.siteId;
		data.returnTo = obj.returnTo;
		selectStandAloneTool("/siteroster/siteroster", data);
	}
};

completeToolLoad();
