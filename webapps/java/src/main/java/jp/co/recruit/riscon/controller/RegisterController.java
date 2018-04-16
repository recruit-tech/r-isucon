package jp.co.recruit.riscon.controller;

import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import jp.co.recruit.riscon.entity.Users;
import jp.co.recruit.riscon.service.RegisterService;

/**
 * RegisterController
 * @author S.Hamaoka
 */
@Controller
public class RegisterController {
    @Autowired
    RegisterService registerService;

    @GetMapping(value= {"/register*"})
    private String register(Model model,HttpServletRequest request,HttpServletResponse response) {
        Users user = (Users) request.getAttribute("user");
        model.addAttribute("user",user);
        model.addAttribute("title","りすこん");
        model.addAttribute("organizations", registerService.findOrganizations());
        model.addAttribute("message", "");
        return "register";
    }

    @PostMapping(value= {"/register"})
    private String registerValidate(Model model,HttpServletRequest request,HttpServletResponse response) {
        try {
            String username = request.getParameter("username");
            String password = request.getParameter("password");
            String firstName = request.getParameter("first_name");
            String lastName = request.getParameter("last_name");
            String[] organization = request.getParameterValues("organization");
            String sessionId = UUID.randomUUID().toString();
            String filename = null;
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
            String message = validation(username,password,firstName,lastName,organization);
            if(message!=null) {
                response.setStatus(400);
                model.addAttribute("organizations", registerService.findOrganizations());
                model.addAttribute("message", message);
                return "register";
            }
            List<Users> usersList = registerService.findUsers(username);
            if(!usersList.isEmpty()) {
                response.setStatus(403);
                model.addAttribute("message", "既にユーザーが登録されています。");
                return "register";
            }
            registerService.insertOrganization(organization, username);
            String salt = generateRandomString(16);
            Argon2 argon2 = Argon2Factory.create();
            String hash = argon2.hash(3, 4096, 1, salt+password);
            registerService.insertUser(username, salt, hash, lastName, firstName, filename==null||filename.isEmpty()?"default.png":filename);
            registerService.insertSession(sessionId, username, (int)(new Date().getTime()/ 1000 + 300));
            response.addCookie(new Cookie("session_id", sessionId));
            request.setAttribute("user", registerService.findUsers(username).get(0));
            return "redirect:/";
        }
        catch (Exception e) {
            System.out.println(e);
            response.setStatus(500);
            model.addAttribute("message", "エラーが発生しました。");
            return "register";
        }
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

    private String validation(String username,String password,String firstName,String lastName,String[] organization) {
        String message = null;
        message = validateOrganizations(organization);
        message = validateUsername(username);
        message = validatePassword(password,username);
        return (message!=null) ? message : null;
    }

    private String validateOrganizations(String[] organization) {
        if(organization == null || !organization.getClass().isArray() || organization.length==0) {
            return "組織が選択されていません。";
        }
        return null;
    }

    private String validateUsername(String username) {
        if(username==null || username.isEmpty()) {
            return "ユーザ名がありません。";
        }else if(username.length() < 5 || username.length() > 30) {
            return "ユーザ名は5文字以上30文字以下にしてください。";
        }else if (!username.matches("[a-zA-Z0-9_]+$")) {
            return "ユーザ名はアルファベットか数字にしてください。";
        }
        return null;
    }

    private String validatePassword(String password,String username) {
        if(password==null || password.isEmpty()) {
            return "パスワードがありません。";
        }else if(password.length() < 5 || password.length() > 30) {
            return "パスワードは5文字以上30文字以下にしてください。";
        }else if (!password.matches("[a-zA-Z0-9_]+$")) {
            return "パスワードはアルファベットか数字にしてください。";
        }else if (username.contains(password)) {
            return "パスワードにはユーザ名を含めないでください。";
        }
        return null;
    }

    private final static char[] hexArray = "0123456789ABCDEF".toCharArray();
    public static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for ( int j = 0; j < bytes.length; j++ ) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }
        return new String(hexChars);
    }

    public String generateRandomString(int num) {
        SecureRandom random =new SecureRandom();
        byte bytes[] = new byte[(int) Math.ceil(num/2)];
        random.nextBytes(bytes);
        byte seed[] = random.generateSeed((int) Math.ceil(num/2));
        return bytesToHex(seed).substring(0, 15);
    }
}