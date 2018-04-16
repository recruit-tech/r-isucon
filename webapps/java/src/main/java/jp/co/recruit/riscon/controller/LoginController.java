package jp.co.recruit.riscon.controller;

import java.util.List;
import java.util.UUID;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import jp.co.recruit.riscon.entity.Users;
import jp.co.recruit.riscon.service.LoginService;

/**
 * LoginController
 * @author S.Hamaoka
 */
@Controller
public class LoginController {
    @Autowired
    LoginService loginService;

    @GetMapping(value= {"/login*"})
    private String login(Model model) {
        model.addAttribute("title", "りすこん");
        model.addAttribute("message", null);
        model.addAttribute("user", null);
        return "login";
    }

    @PostMapping(value= {"/login"})
    private String loginValidate(Model model,HttpServletRequest request, HttpServletResponse response) {
        try {
            String username = (String)request.getParameter("username");
            String password = (String)request.getParameter("password");
            List<Users> usersList = loginService.findUsers(username);
            if(usersList.isEmpty()) {
                response.setStatus(400);
                model.addAttribute("message", "ユーザ名もしくはパスワードが間違っています。");
                return "login";
            }
            Users user = usersList.get(0);
            Argon2 argon2 = Argon2Factory.create();
            if(!argon2.verify(user.hash, user.salt + password)) {
                response.setStatus(400);
                model.addAttribute("message", "ユーザ名もしくはパスワードが間違っています。");
                return "login";
            }
            model.addAttribute("user", user);
            String sessionId = UUID.randomUUID().toString();
            loginService.deleteSession(username);
            loginService.insertSession(sessionId,username);
            response.addCookie(new Cookie("session_id", sessionId));
            request.setAttribute("user",user);
            return "redirect:/";
        }
        catch (Exception e) {
            System.out.println(e);
            response.setStatus(500);
            model.addAttribute("message", "エラーが発生しました。");
            return "login";
        }
    }
}
