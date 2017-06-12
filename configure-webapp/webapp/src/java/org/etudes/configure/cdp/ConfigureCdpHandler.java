/**********************************************************************************
 * $URL: https://source.etudes.org/svn/apps/configure/trunk/configure-webapp/webapp/src/java/org/etudes/configure/cdp/ConfigureCdpHandler.java $
 * $Id: ConfigureCdpHandler.java 10709 2015-05-04 21:02:25Z murthyt $
 ***********************************************************************************
 *
 * Copyright (c) 2013, 2014, 2015 Etudes, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **********************************************************************************/

package org.etudes.configure.cdp;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.etudes.archives.api.ArchiveDescription;
import org.etudes.archives.api.ArchivesService;
import org.etudes.cdp.api.CdpHandler;
import org.etudes.cdp.api.CdpStatus;
import org.etudes.cdp.util.CdpResponseHelper;
import org.etudes.siteimport.api.FileImportService;
import org.etudes.siteimport.api.SiteImportService;
import org.etudes.util.DateHelper;
import org.sakaiproject.component.api.ServerConfigurationService;
import org.sakaiproject.component.cover.ComponentManager;
import org.sakaiproject.exception.IdUnusedException;
import org.sakaiproject.exception.PermissionException;
import org.sakaiproject.site.api.DateManagerService;
import org.sakaiproject.site.api.PubDatesService;
import org.sakaiproject.site.api.Site;
import org.sakaiproject.site.api.SiteInfo;
import org.sakaiproject.site.api.SitePage;
import org.sakaiproject.site.api.SiteService;
import org.sakaiproject.site.api.SiteService.SortType;
import org.sakaiproject.site.api.ToolConfiguration;
import org.sakaiproject.site.api.ToolDateRange;
import org.sakaiproject.time.api.Time;
import org.sakaiproject.time.api.TimeService;
import org.sakaiproject.tool.api.Tool;
import org.sakaiproject.tool.api.ToolManager;
import org.sakaiproject.util.StringUtil;

/**
 */
public class ConfigureCdpHandler implements CdpHandler
{
	/** Our log (commons). */
	private static Log M_log = LogFactory.getLog(ConfigureCdpHandler.class);

	/** the tools we leave untouched in sites. */
	protected String[] keeperToolIds =
	{ "sakai.iframe", "sakai.news", "blogger", "sakai.dropbox", "sakai.podcasts", "sakai.rwiki" };

	protected String[] siteLinkToolIds =
	{ "sakai.iframe" };

	/** map the skin value to the skin display name. */
	protected Map<String, String> skinDisplayNames = new HashMap<String, String>();

	/** map the skin value to the iconUrl. */
	protected Map<String, String> skinIconUrls = new HashMap<String, String>();

	/** map the skin display name to the skin value. */
	protected Map<String, String> skinNames = new HashMap<String, String>();

	/** the synoptic tools. */
	protected String[] synopticAllListArray =
	{ "sakai.synoptic.announcement", "sakai.synoptic.jforum.tool", "sakai.synoptic.chat" };

	public ConfigureCdpHandler()
	{
		readSkinConfiguration();
	}

	public String getPrefix()
	{
		return "configure";
	}

	/**
	 * Handle requests.
	 */
	public Map<String, Object> handle(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String requestPath,
			String path, String authenticatedUserId) throws ServletException, IOException
	{
		// if no authenticated user, we reject all requests
		if (authenticatedUserId == null)
		{
			Map<String, Object> rv = new HashMap<String, Object>();
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.notLoggedIn.getId());
			return rv;
		}

		else if (requestPath.equals("config"))
		{
			return dispatchConfig(req, res, parameters, path, authenticatedUserId);
		}
		else if (requestPath.equals("setConfig"))
		{
			return dispatchSetConfig(req, res, parameters, path);
		}
		else if (requestPath.equals("importSites"))
		{
			return dispatchImportSites(req, res, parameters, path, authenticatedUserId);
		}
		else if (requestPath.equals("importSiteTools"))
		{
			return dispatchImportSiteTools(req, res, parameters, path);
		}
		else if (requestPath.equals("importFromSite"))
		{
			return dispatchImportFromSite(req, res, parameters, path, authenticatedUserId);
		}
		else if (requestPath.equals("uploadToSite"))
		{
			return dispatchUploadToSite(req, res, parameters, path, authenticatedUserId);
		}

		return null;
	}

	/**
	 * @return The ArchiveService, via the component manager.
	 */
	private ArchivesService archivesService()
	{
		return (ArchivesService) ComponentManager.get(ArchivesService.class);
	}

	/**
	 * @return The DateManagerService, via the component manager.
	 */
	private DateManagerService dateManagerService()
	{
		return (DateManagerService) ComponentManager.get(DateManagerService.class);
	}

	/**
	 * @return The FileImportService, via the component manager.
	 */
	private FileImportService fileImportService()
	{
		return (FileImportService) ComponentManager.get(FileImportService.class);
	}

	/**
	 * @return The PubDatesService, via the component manager.
	 */
	private PubDatesService pubDatesService()
	{
		return (PubDatesService) ComponentManager.get(PubDatesService.class);
	}

	/**
	 * @return The ServerConfigurationService, via the component manager.
	 */
	private ServerConfigurationService serverConfigurationService()
	{
		return (ServerConfigurationService) ComponentManager.get(ServerConfigurationService.class);
	}

	/**
	 * @return The SiteImportManager, via the component manager.
	 */
	private SiteImportService siteImportService()
	{
		return (SiteImportService) ComponentManager.get(SiteImportService.class);
	}

	/**
	 * @return The SiteService, via the component manager.
	 */
	private SiteService siteService()
	{
		return (SiteService) ComponentManager.get(SiteService.class);
	}

	/**
	 * @return The TimeService, via the component manager.
	 */
	private TimeService timeService()
	{
		return (TimeService) ComponentManager.get(TimeService.class);
	}

	/**
	 * @return The ToolManager, via the component manager.
	 */
	private ToolManager toolManager()
	{
		return (ToolManager) ComponentManager.get(ToolManager.class);
	}

	@SuppressWarnings("unchecked")
	protected boolean adjustSiteLinks(int linkCount, Map<String, Object> parameters, Site site)
	{
		boolean changed = false;
		String from3Party = (String) parameters.get("from3party");
		boolean check3Party = "from3party".equals(from3Party);

		// remove all sitelinks or External service web content tools based on who invokes this method
		List<SitePage> pagesToRemove = new ArrayList<SitePage>();
		for (SitePage page : (List<SitePage>) site.getPages())
		{
			Collection<ToolConfiguration> found = page.getTools(this.siteLinkToolIds);
			if (found.isEmpty()) continue;
			Iterator<ToolConfiguration> foundIter = found.iterator();
			String foundThirdPartyService = foundIter.next().getPlacementConfig().getProperty("thirdPartyService");
			// if invoked from external service and tool is thirdPartyService
			if (check3Party && "Yes".equals(foundThirdPartyService)) pagesToRemove.add(page);
			// if invoked from site Links and tool is not a thirdPartyService
			if (!check3Party && (foundThirdPartyService == null || "No".equals(foundThirdPartyService))) pagesToRemove.add(page);
		}
		for (SitePage page : pagesToRemove)
		{
			site.removePage(page);
			changed = true;
		}

		// add new tools for the new links
		Tool registeredTool = toolManager().getTool(this.siteLinkToolIds[0]);

		for (int i = 0; i < linkCount; i++)
		{
			String title = StringUtil.trimToNull((String) parameters.get("title" + i));
			String url = StringUtil.trimToNull((String) parameters.get("url" + i));
			String key = StringUtil.trimToNull((String) parameters.get("key" + i));
			String secret = StringUtil.trimToNull((String) parameters.get("secret" + i));
			String extra = StringUtil.trimToNull((String) parameters.get("extraInformation" + i));
			String popup = StringUtil.trimToNull((String) parameters.get("popup" + i));
			String height = StringUtil.trimToNull((String) parameters.get("height" + i));
			String justService = StringUtil.trimToNull((String) parameters.get("thirdPartyService" + i));
			
			if ((title == null) || (url == null)) continue;

			String[] urlParts = StringUtil.splitFirst(url, "://");
			if (urlParts.length == 2)
			{
				if (urlParts[0].equalsIgnoreCase("http"))
				{
					url = "http://" + urlParts[1];
				}
				else if (urlParts[0].equalsIgnoreCase("https"))
				{
					url = "https://" + urlParts[1];
				}
				else
				{
					url = "http://" + urlParts[1];
				}
			}
			else if (!url.startsWith("//"))
			{
				url = "http://" + urlParts[urlParts.length - 1];
			}

			// enforce new window if address is http://
			boolean checkHttpNewWindow = false;
			if (!url.startsWith("//"))
			{
				urlParts = StringUtil.splitFirst(url, "://");
				if (urlParts.length == 2 && urlParts[0].equalsIgnoreCase("http")) checkHttpNewWindow = true;
			}

			SitePage page = site.addPage();
			page.setTitle(title);
			if ("1".equals(popup) || checkHttpNewWindow) page.setPopup(true);
			ToolConfiguration tool = page.addTool();
			tool.setTool(this.siteLinkToolIds[0], registeredTool);
			tool.setTitle(title);
			tool.getPlacementConfig().setProperty("source", url);
			tool.getPlacementConfig().setProperty("key", (key == null ? "" : key));
			tool.getPlacementConfig().setProperty("secret", (secret == null ? "" : secret));
			tool.getPlacementConfig().setProperty("height", (height == null ? "600px" : height));
			tool.getPlacementConfig().setProperty("extraInformation", (extra == null ? "" : extra));
			tool.getPlacementConfig().setProperty("thirdPartyService", (justService == null ? "No" : justService));
			changed = true;
		}

		return changed;
	}

	/**
	 * Update the site's skin information based on the new skin display name.
	 * 
	 * @param skin
	 *        The selected skin's display name.
	 * @param site
	 *        The site.
	 * @return true if changed
	 */
	protected boolean adjustSiteSkin(String skin, Site site)
	{
		boolean changed = false;

		if ("default".equals(skin))
		{
			site.setIconUrl(null);
			site.setSkin(null);
			changed = true;
		}
		else
		{
			String newSkin = this.skinNames.get(skin);
			if (newSkin != null)
			{
				String newSkinIconUrl = this.skinIconUrls.get(newSkin);

				site.setIconUrl(newSkinIconUrl);
				site.setSkin(newSkin);
				changed = true;
			}
		}

		return changed;
	}

	/**
	 * Given the list of tool ids in a comma separated string, adjust the site to have only these tools.
	 * 
	 * @param tools
	 *        The tool ids in a comma separated string.
	 * @param site
	 *        The site.
	 * @return true if changed
	 */
	@SuppressWarnings("unchecked")
	protected boolean adjustSiteTools(String tools, Site site)
	{
		boolean changed = false;
		String[] ucbGradebookToolId = null;
		if (tools.contains("e3.gradebook"))
		{
			ucbGradebookToolId = new String[] {"sakai.gradebook.tool"};
		}
		
		String[] desiredToolIds = StringUtil.split(tools + ",e3.configure,e3.siteroster", ",");
		Set<String> toolsToAdd = new HashSet<String>(Arrays.asList(desiredToolIds));
		
		

		// remove any pages that have a tool not in the list
		List<SitePage> pagesToRemove = new ArrayList<SitePage>();
		for (SitePage page : (List<SitePage>) site.getPages())
		{
			// see if the page has any of our desired-to-keep tools
			Collection<ToolConfiguration> found = page.getTools(desiredToolIds);
			for (ToolConfiguration tool : found)
			{
				// any found we do not need to add, since they are already here
				toolsToAdd.remove(tool.getToolId());
			}
			// if we found none, this page may not be needed
			if (found.isEmpty())
			{
				// check for UCB gradebook. old UCB gradebook id is "sakai.gradebook.tool" and is replaced with "e3.gradebook" in configure.html for new gradebook tool
				if (ucbGradebookToolId != null)
				{
					found = page.getTools(ucbGradebookToolId);
					for (ToolConfiguration tool : found)
					{
						// any found we do not need to add, since they are already here
						toolsToAdd.remove(tool.getToolId());
						toolsToAdd.remove("e3.gradebook");
					}
				}
				
				if (found.isEmpty())
				{
					// if the page has any of the tools we pass-through, keep it
					Collection<ToolConfiguration> keepers = page.getTools(this.keeperToolIds);
					if (keepers.isEmpty())
					{
						pagesToRemove.add(page);
					}
				}
			}
		}
		
		// remove the pages we don't need (done here outside the checking loop to avoid concurrent modification exceptions)
		for (SitePage page : pagesToRemove)
		{
			site.removePage(page);
			changed = true;
		}

		// add a page for each tool that does not already have a page
		for (String toolId : toolsToAdd)
		{
			Tool registeredTool = toolManager().getTool(toolId);
			if (registeredTool != null)
			{
				SitePage page = site.addPage();
				page.setTitle(registeredTool.getTitle());
				ToolConfiguration tool = page.addTool();
				tool.setTool(toolId, registeredTool);
				changed = true;
			}
		}

		return changed;
	}

	/**
	 * Dispatch the config request.
	 * 
	 * @param req
	 * @param res
	 * @param parameters
	 * @param path
	 * @param userId
	 * @return
	 * @throws ServletException
	 * @throws IOException
	 */
	protected Map<String, Object> dispatchConfig(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String path,
			String userId) throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the site id parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchConfig - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		Site site = null;
		try
		{
			site = siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
		}

		if (site == null)
		{
			M_log.warn("dispatchConfig - missing site: " + siteId);

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.accessDenied.getId());
			return rv;
		}

		// convert to new format if needed
		if (siteImportService().updateSiteTools(userId, site))
		{
			// refresh the site
			try
			{
				site = siteService().getSite(siteId);
			}
			catch (IdUnusedException e)
			{
			}
		}

		Map<String, Object> configMap = new HashMap<String, Object>();
		rv.put("config", configMap);
		loadConfig(configMap, site);

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	protected Map<String, Object> dispatchImportFromSite(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters,
			String path, String userId) throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the site id parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchImportFromSite - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}
		Site site = null;
		try
		{
			site = this.siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
			M_log.warn("dispatchImportFromSite - site not found: " + siteId);

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		// fromSiteId
		String fromSiteId = (String) parameters.get("fromSiteId");
		if (fromSiteId == null)
		{
			M_log.warn("dispatchImportFromSite - no fromSiteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		// tools
		String tools = (String) parameters.get("tools");
		if (tools == null)
		{
			M_log.warn("dispatchImportFromSite - no tools parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		// for sites
		if (fromSiteId.startsWith("S"))
		{
			try
			{
				Site fromSite = this.siteService().getSite(fromSiteId.substring(1));
				siteImportService().importFromSite(userId, fromSite, StringUtil.split(tools, "\t"), site);
			}
			catch (IdUnusedException e)
			{
				M_log.warn("dispatchImportFromSite - fromSite not found: " + fromSiteId);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
				return rv;
			}
			catch (PermissionException e)
			{
				M_log.warn("dispatchImportFromSite: " + e.toString());

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.accessDenied.getId());
				return rv;
			}
		}
		// from archive
		else
		{
			String archiveSiteId = fromSiteId.substring(1);
			siteImportService().importFromArchive(archiveSiteId, StringUtil.split(tools, "\t"), site);
		}

		// respond with the new config
		try
		{
			// get the site again in case it was updated (base date)
			site = siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
		}
		Map<String, Object> configMap = new HashMap<String, Object>();
		rv.put("config", configMap);
		loadConfig(configMap, site);

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	/**
	 * Dispatch the importSites request.
	 * 
	 * @param req
	 * @param res
	 * @param parameters
	 * @param path
	 * @param userId
	 * @return
	 * @throws ServletException
	 * @throws IOException
	 */
	@SuppressWarnings("unchecked")
	protected Map<String, Object> dispatchImportSites(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String path,
			String userId) throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the site id parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchImportSites - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		List<Site> sites = siteService().getSites(org.sakaiproject.site.api.SiteService.SelectionType.UPDATE, null, null, null, SortType.TERM_DESC,
				null);
		List<ArchiveDescription> archives = archivesService().getUserArchives(userId);

		// return a "sites" array with each site and archive
		List<Map<String, String>> sitesList = new ArrayList<Map<String, String>>();
		rv.put("sites", sitesList);

		for (Site site : sites)
		{
			// skip the site we are importing to
			if (site.getId().equals(siteId)) continue;

			Map<String, String> siteMap = new HashMap<String, String>();
			sitesList.add(siteMap);

			siteMap.put("siteId", "S" + site.getId());
			siteMap.put("title", site.getTitle());
			siteMap.put("term", CdpResponseHelper.describeTerm(site.getTermSuffix()));
		}

		for (ArchiveDescription a : archives)
		{
			Map<String, String> siteMap = new HashMap<String, String>();
			sitesList.add(siteMap);

			siteMap.put("siteId", "A" + a.getSiteId());
			siteMap.put("title", a.getTitle());
			siteMap.put("term", "Archived: " + CdpResponseHelper.describeTerm(a.getTermDescription()));
		}

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	/**
	 * Dispatch the importSiteTools request.
	 * 
	 * @param req
	 * @param res
	 * @param parameters
	 * @param path
	 * @param userId
	 * @return
	 * @throws ServletException
	 * @throws IOException
	 */
	protected Map<String, Object> dispatchImportSiteTools(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String path)
			throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the site id parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchImportSiteTools - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		// site or archive? Remove the prefix character
		boolean siteNotArchive = siteId.startsWith("S");
		siteId = siteId.substring(1);

		// get the tools from the site or archive
		String[] toolIds = null;
		if (siteNotArchive)
		{
			Site site = null;
			try
			{
				site = siteService().getSite(siteId);
				toolIds = siteImportService().getSiteToolsForImport(site);
			}
			catch (IdUnusedException e)
			{
				M_log.warn("dispatchImportSiteTools - missing site: " + siteId);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.accessDenied.getId());
				return rv;
			}
		}
		else
		{
			toolIds = siteImportService().getArchiveToolsForImport(siteId);
		}

		// return a "tools" array with each site and archive
		List<Map<String, String>> toolsList = new ArrayList<Map<String, String>>();
		rv.put("tools", toolsList);

		for (String toolId : toolIds)
		{
			Map<String, String> toolMap = new HashMap<String, String>();
			toolsList.add(toolMap);
			toolMap.put("toolId", toolId);
		}

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	/**
	 * Dispatch the set config request.
	 * 
	 * @param req
	 * @param res
	 * @param parameters
	 * @param path
	 * @return
	 * @throws ServletException
	 * @throws IOException
	 */
	protected Map<String, Object> dispatchSetConfig(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String path)
			throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the site id parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchSetConfig - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		Site site = null;
		try
		{
			site = siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
		}
		if (site == null)
		{
			M_log.warn("dispatchSetConfig - missing site: " + siteId);

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.accessDenied.getId());
			return rv;
		}

		boolean changed = false;

		// skin?
		String skin = (String) parameters.get("skin");
		if (skin != null)
		{
			if (adjustSiteSkin(skin, site)) changed = true;
		}

		// tools?
		String tools = (String) parameters.get("tools");
		
		if (tools != null)
		{
			if (adjustSiteTools(tools, site)) changed = true;
		}

		// site links?
		String linksCountStr = (String) parameters.get("linksCount");
		if (linksCountStr != null)
		{
			int linksCount = -1;
			try
			{
				linksCount = Integer.valueOf(linksCountStr);
			}
			catch (NumberFormatException e)
			{
				M_log.warn("dispatchSetConfig - linksCount not int: " + linksCountStr);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
				return rv;
			}

			if (adjustSiteLinks(linksCount, parameters, site)) changed = true;
		}

		if (changed)
		{
			try
			{
				siteService().save(site);
			}
			catch (IdUnusedException e)
			{
				M_log.warn("dispatchSetConfig -  site: " + siteId + " : " + e);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
				return rv;
			}
			catch (PermissionException e)
			{
				M_log.warn("dispatchSetConfig -  site: " + siteId + " : " + e);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.accessDenied.getId());
				return rv;
			}
		}

		// base date?
		String newBaseDateStr = (String) parameters.get("baseDate");
		if (newBaseDateStr != null)
		{
			try
			{
				Date baseDate = CdpResponseHelper.dateFromDateDisplayInUserZone(newBaseDateStr);

				// even the playing field between the user entered date and the computed base date (basically aligning the time component to 0)
				Date currentBaseDate = dateManagerService().getMinStartDate(site.getId());
				String currentBaseDateAsDateInUserZone = CdpResponseHelper.dateDisplayInUserZone(currentBaseDate.getTime());
				currentBaseDate = CdpResponseHelper.dateFromDateDisplayInUserZone(currentBaseDateAsDateInUserZone);

				dateManagerService().applyBaseDate(siteId, currentBaseDate, baseDate);
			}
			catch (IllegalArgumentException e)
			{
			}
		}

		// publication?
		String publish = (String) parameters.get("publish"); // publish unpublish setdates
		String pubDate = (String) parameters.get("pubDate");
		String unpubDate = (String) parameters.get("unpubDate");
		if (publish != null)
		{
			Date publishOn = null;
			Date unpublishOn = null;
			Time publishOnTime = null;
			Time unpublishOnTime = null;
			try
			{
				if (pubDate != null) publishOn = CdpResponseHelper.dateFromDateTimeDisplayInUserZone(pubDate);
			}
			catch (IllegalArgumentException e)
			{
			}
			try
			{
				if (unpubDate != null) unpublishOn = CdpResponseHelper.dateFromDateTimeDisplayInUserZone(unpubDate);
			}
			catch (IllegalArgumentException e)
			{
			}
			if (publishOn != null) publishOnTime = timeService().newTime(publishOn.getTime());
			if (unpublishOn != null) unpublishOnTime = timeService().newTime(unpublishOn.getTime());

			pubDatesService().processPublishOptions(publish, publishOnTime, unpublishOnTime, site, new SiteInfo());
		}

		// respond with the new config
		try
		{
			// get the site again in case it was updated (base date)
			site = siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
		}
		Map<String, Object> configMap = new HashMap<String, Object>();
		rv.put("config", configMap);
		loadConfig(configMap, site);

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	protected Map<String, Object> dispatchUploadToSite(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String path,
			String userId) throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the site id parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchUploadToSite - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}
		Site site = null;
		try
		{
			site = this.siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
			M_log.warn("dispatchUploadToSite - site not found: " + siteId);

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		// get the uploadType parameter
		String uploadType = (String) parameters.get("uploadType");
		if (uploadType == null)
		{
			M_log.warn("dispatchUploadToSite - no uploadType parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		String fileName = null;
		InputStream stream = null;
		
		if (parameters.get("selectedfile") != null && ((String) parameters.get("selectedfile")).length() > 0)
		{
			// read from request
			String readURI = (String) parameters.get("selectedfile");
			fileName = readURI.substring(readURI.lastIndexOf("/") + 1);
			readURI = readURI.replace(" ", "%20");
			stream = new URL(readURI).openStream();
		}

		// get the file
		Object o = parameters.get("upload");
		if ((o != null) && (o instanceof FileItem))
		{
			FileItem file = (FileItem) o;
			fileName = file.getName();
			stream = file.getInputStream();
		}

		if (fileName == null && stream == null)
		{
			M_log.warn("dispatchUploadToSite - no upload parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}
		
		String message = fileImportService().importFromFile(fileName, stream, uploadType, site, userId);

		if (message == null)
		{
			message = "There was an error importing your file.";
		}

		// respond with the new config
		try
		{
			// get the site again in case it was updated (base date)
			site = siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
		}
		Map<String, Object> configMap = new HashMap<String, Object>();
		rv.put("config", configMap);
		loadConfig(configMap, site);

		rv.put("status", message);

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	/**
	 * Load the site's configuration for return to the CDP client.
	 * 
	 * @param configMap
	 * @param site
	 */
	@SuppressWarnings("unchecked")
	protected void loadConfig(Map<String, Object> configMap, Site site)
	{
		configMap.put("siteId", site.getId());

		String skin = site.getSkin();
		if (skin == null)
		{
			skin = serverConfigurationService().getString("skin.default");
		}
		else
		{
			skin = this.skinDisplayNames.get(skin);
		}
		configMap.put("skin", skin);

		configMap.put("title", site.getTitle());

		List<Map<String, String>> toolsList = new ArrayList<Map<String, String>>();
		configMap.put("tools", toolsList);

		for (SitePage page : (List<SitePage>) site.getOrderedPages())
		{
			for (ToolConfiguration tool : (List<ToolConfiguration>) page.getTools())
			{
				if (tool.getToolId().equals("sakai.iframe")) continue;
				if (tool.getToolId().equals("sakai.news")) continue;
				if (tool.getToolId().equals("e3.configure")) continue;
				if (tool.getToolId().equals("e3.siteroster")) continue;
				if (tool.getToolId().equals("sakai.synoptic.announcement")) continue;
				if (tool.getToolId().equals("sakai.synoptic.jforum.tool")) continue;
				if (tool.getToolId().equals("sakai.synoptic.chat")) continue;
				if (tool.getToolId().equals("sakai.iframe.site")) continue;
				if (tool.getToolId().equals("sakai.siteinfo")) continue;

				Map<String, String> toolMap = new HashMap<String, String>();
				toolsList.add(toolMap);
				// if old UCB gradebook found to enable gradebook checkbox checked and change the tool id to e3.gradebook
				if (tool.getToolId().equalsIgnoreCase("sakai.gradebook.tool"))
				{
					toolMap.put("toolId", "e3.gradebook");
				}
				else
				{
					toolMap.put("toolId", tool.getToolId());
				}
				toolMap.put("title", tool.getTitle());
			}
		}

		// Note: copied from SiteAction.java
		if (site.getProperties().getProperty("pub-date") != null)
		{
			try
			{
				// Note: originally, the date was stored in properties as input format, default time zone, rather than as a Time property -ggolden
				// If we fix this, we read the value with Time pubTime = siteProperties.getTimeProperty(PROP_SITE_PUB_DATE);
				String pubValue = site.getProperties().getProperty("pub-date");
				Date pubDate = DateHelper.parseDateFromDefault(pubValue);
				configMap.put("pubDate", CdpResponseHelper.dateTimeDisplayInUserZone(pubDate.getTime()));

				// if this is in the future
				if (pubDate.after(new Date()))
				{
					configMap.put("willPublish", CdpResponseHelper.formatBoolean(true));
				}
			}
			catch (ParseException e)
			{
			}
		}
		if (site.getProperties().getProperty("unpub-date") != null)
		{
			try
			{
				// Note: originally, the date was stored in properties as input format, default time zone, rather than as a Time property -ggolden
				// If we fix this, we read the value with Time pubTime = siteProperties.getTimeProperty(PROP_SITE_UNPUB_DATE);
				String unpubValue = site.getProperties().getProperty("unpub-date");
				Date unpubDate = DateHelper.parseDateFromDefault(unpubValue);
				configMap.put("unpubDate", CdpResponseHelper.dateTimeDisplayInUserZone(unpubDate.getTime()));
			}
			catch (ParseException e)
			{
			}
		}

		configMap.put("published", CdpResponseHelper.formatBoolean(site.isPublished()));

		Date currentBaseDate = dateManagerService().getMinStartDate(site.getId());
		if (currentBaseDate != null)
		{
			configMap.put("baseDate", CdpResponseHelper.dateDisplayInUserZone(currentBaseDate.getTime()));
			List<Map<String, String>> baseDatesList = new ArrayList<Map<String, String>>();
			configMap.put("baseDates", baseDatesList);
			List<ToolDateRange> dateRanges = dateManagerService().getDateRanges(site.getId());
			for (ToolDateRange range : dateRanges)
			{
				Map<String, String> baseDateMap = new HashMap<String, String>();
				baseDatesList.add(baseDateMap);
				baseDateMap.put("tool", range.getToolName());
				baseDateMap.put("range", range.getCurrentDateRange());
				baseDateMap.put("outRange", CdpResponseHelper.formatBoolean(range.getOutsideRangeFlag()));
			}
		}

		// links based on iframe tools
		List<Map<String, String>> linksList = new ArrayList<Map<String, String>>();
		configMap.put("links", linksList);

		// 3 party links
		List<Map<String, String>> serviceList = new ArrayList<Map<String, String>>();

		Collection<ToolConfiguration> linkTools = site.getTools("sakai.iframe");
		for (ToolConfiguration linkTool : linkTools)
		{
			linkTool.getTitle();
			linkTool.getPlacementConfig().getProperty("source");
						
			Map<String, String> linkMap = new HashMap<String, String>();

			// if sitelinks then add to linksList and if third party service then to serviceslist
			if ("Yes".equals(linkTool.getPlacementConfig().getProperty("thirdPartyService")))
				serviceList.add(linkMap);
			else
				linksList.add(linkMap);

			linkMap.put("title", linkTool.getTitle());
			linkMap.put("url", linkTool.getPlacementConfig().getProperty("source"));
			String key = linkTool.getPlacementConfig().getProperty("key");
			linkMap.put("key", (key == null ? "" : key));

			String secret = linkTool.getPlacementConfig().getProperty("secret");
			linkMap.put("secret", (secret == null ? "" : secret));

			String extra = linkTool.getPlacementConfig().getProperty("extraInformation");
			linkMap.put("extraInformation", (extra == null ? "" : extra));

			String height = linkTool.getPlacementConfig().getProperty("height");
			if (height == null) height = "600px";
			linkMap.put("height", height);
			linkMap.put("popup", CdpResponseHelper.formatBoolean(site.getPage(linkTool.getPageId()).isPopUp()));
			
			String thirdPartyService = linkTool.getPlacementConfig().getProperty("thirdPartyService");
			linkMap.put("thirdPartyService", (thirdPartyService == null ? "No" : thirdPartyService));
		}

		// merge servicelist in the end. Doesn't interfere in reorder of sitelinks
		linksList.addAll(serviceList);
	}

	/**
	 * Read the skin configuration, setting up the needed mappings.
	 */
	protected void readSkinConfiguration()
	{
		// the display name of the skin
		String[] iconNames = serverConfigurationService().getStrings("iconNames");

		// the site.iconUrl for the skin
		String[] iconUrls = serverConfigurationService().getStrings("iconUrls");

		// the site.skin for the skin
		String[] iconSkins = serverConfigurationService().getStrings("iconSkins");

		if ((iconNames != null) && (iconUrls != null) && (iconSkins != null) && (iconNames.length == iconUrls.length)
				&& (iconNames.length == iconSkins.length))
		{
			for (int i = 0; i < iconNames.length; i++)
			{
				// map the skin value to the iconUrl
				this.skinIconUrls.put(iconSkins[i], iconUrls[i]);

				// map the skin value to the skin display name
				this.skinDisplayNames.put(iconSkins[i], iconNames[i]);

				// map the skin display name to the skin value
				this.skinNames.put(iconNames[i], iconSkins[i]);
			}
		}
		else
		{
			M_log.warn("inconsistent or missing configuration values for iconNames, iconUrls, iconSkins");
		}
	}
}
