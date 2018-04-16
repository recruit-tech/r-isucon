package jp.co.recruit.riscon.controller;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jp.co.recruit.riscon.service.LogoutService;

/**
 * LogoutController
 * @author S.Hamaoka
 */
@Controller
public class LogoutController {
    @Autowired
    LogoutService logoutService;

    @GetMapping(value= {"/logout*"})
    private String logout(Model model,HttpServletRequest request,HttpServletResponse response) {
        String sessionId = null;
        for(Cookie cookie:((HttpServletRequest)request).getCookies()) {
            if("session_id".equals(cookie.getName())) {
                sessionId = cookie.getValue();
                break;
            }
        }
        try {
            if(sessionId==null) {
                return "redirect:/";
            }else {
                logoutService.deleteSession(sessionId);
                Cookie cookies[] =request.getCookies();
                for (Cookie cookie : cookies ) {
                    if ("session_id".equals(cookie.getName())) {
                        cookie.setMaxAge(0);
                        cookie.setPath("/");
                        response.addCookie(cookie);
                    }
                }
                request.setAttribute("user", null);
            }
        }
        catch(Exception e){
        }
        return "redirect:/";
    }
}