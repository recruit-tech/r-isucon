package jp.co.recruit.riscon.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import jp.co.recruit.riscon.entity.BelongsOrganizations;
import jp.co.recruit.riscon.entity.Organizations;
import jp.co.recruit.riscon.entity.Users;
import jp.co.recruit.riscon.service.UsersService;
import jp.co.recruit.riscon.util.entity.ValidateUsingLambda;

/**
 * UsersController
 * @author S.Hamaoka
 */
@Controller
public class UsersController {
    @Autowired
    UsersService usersService;

    @GetMapping(value= {"/users*"})
    private String users(Model model,HttpServletRequest request,HttpServletResponse response) {
        return users(model, request, response,null);
    }

    @GetMapping(value= {"/users/{username}"})
    private String users(Model model,HttpServletRequest request,HttpServletResponse response,@PathVariable(value="username") String username) {
        Users user = (Users) request.getAttribute("user");
        if(user==null) {
            return "redirect:/login";
        }
        if(username==null) {
            username = user.username;
        }
        try {
            return renderUserPage(model,request,response,username,null);
        }catch (Exception e) {
            System.out.println(e);
            response.setStatus(500);
            model.addAttribute("message", "エラーが発生しました。");
            model.addAttribute("user", null);
            model.addAttribute("organizations",null);
            model.addAttribute("firstName", null);
            model.addAttribute("lastName", null);
            return "error";
        }
    }

    @PostMapping(value= {"/users"})
    private String validateUsers(Model model,HttpServletRequest request, HttpServletResponse response) {
        String firstName = request.getParameter("first_name");
        String lastName = request.getParameter("last_name");
        String[] organization = request.getParameterValues("organization");
        String filename = null;
        Users user = (Users) request.getAttribute("user");
        String username=null;
        if(user!=null) {
            username = user.username;
        }
        try {
            String sessionId = UUID.randomUUID().toString();
            String message = validation(firstName, lastName, organization);
            if(message!=null) {
                return renderUserPage(model, request, response, username, message);
            }
            try {
                for(Part part:request.getParts()) {
                    filename = this.getFileName(part);
                    if(!(filename==null || filename.isEmpty())) {
                        String[] mimetype = filename.split(Pattern.quote("."));
                        String ext = mimetype[mimetype.length-1];
			            if (!ext.equals("jpeg") && !ext.equals("jpg") && !ext.equals("png") && !ext.equals("gif")) {
                            filename = null;
			                break;
			            }
                        filename = username+"-"+String.valueOf(new Date().getTime())+"."+sessionId+"."+ext;
                        part.write(filename);
                        break;
                    }
                }
            } catch(javax.servlet.ServletException e) {
              // ignore file upload exception
            }
            usersService.deleteBelongsOrganizations(username);
            usersService.insertOrganization(organization, username);
            if(filename!=null && !filename.isEmpty()) {
                usersService.updateUsersWithIcon(firstName, lastName, filename, username);
            }else {
                usersService.updateUsers(firstName, lastName, username);
            }
            user.firstName=firstName;
            user.lastName=lastName;
            request.setAttribute("user", user);
            return "redirect:/";
        }
        catch(Exception e) {
            System.out.println(e);
            response.setStatus(500);
            model.addAttribute("message", "エラーが発生しました。");
            model.addAttribute("user", null);
            model.addAttribute("organizations",null);
            model.addAttribute("firstName", null);
            model.addAttribute("lastName", null);
            return "error";
        }
    }

    private String renderUserPage(Model model,HttpServletRequest request,HttpServletResponse response,String username,String message) {
        if(username==null) {
            model.addAttribute("message", "ユーザーが見つかりません");
            response.setStatus(404);
            return "error";
        }
        Users users = usersService.findUsers(username);
        if(users==null) {
            model.addAttribute("message", "ユーザーが見つかりません");
            response.setStatus(404);
            return "error";
        }
        List<Organizations> organizationsList = new ArrayList<>();
        for(BelongsOrganizations belongsOrganizations: usersService.findBelongsOrganizations(username)) {
            organizationsList.add(usersService.findOrganizations(belongsOrganizations.organizationsIdName.organizationId));
        }
        model.addAttribute("belongOrgs", organizationsList);
        Users user = (Users) request.getAttribute("user");
        if(user!=null && user.username.equals(username)) {
            model.addAttribute("ismine",true);
            model.addAttribute("organizations", usersService.findOrganizations());
            model.addAttribute("firstName", user.firstName);
            model.addAttribute("lastName", user.lastName);
        }else {
            model.addAttribute("ismine",false);
        }
        model.addAttribute("user", users);
        model.addAttribute("lambda", new ValidateUsingLambda());
        if(message!=null) {
            model.addAttribute("message", message);
        }
        return "user";
    }

    private String getFileName(Part part) {
        String name=null;
        for (String dispotion : part.getHeader("Content-Disposition").split(";")) {
            if (dispotion.trim().startsWith("filename")) {
                name = dispotion.substring(dispotion.indexOf("=") + 1).replace("\"", "").trim();
                name = name.substring(name.lastIndexOf("\\") + 1);
                break;
            }
        }
        return name;
    }

    private String validation(String firstName,String lastName,String[] organization) {
        String message = null;
        message = validateOrganizations(organization);
        return (message!=null) ? message : null;
    }

    private String validateOrganizations(String[] organization) {
        if(organization == null || !organization.getClass().isArray() || organization.length==0) {
            return "組織が選択されていません。";
        }
        return null;
    }
}