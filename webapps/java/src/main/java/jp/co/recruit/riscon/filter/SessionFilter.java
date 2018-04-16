package jp.co.recruit.riscon.filter;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jp.co.recruit.riscon.entity.Session;
import jp.co.recruit.riscon.entity.Users;
import jp.co.recruit.riscon.service.SessionFilterService;

@Component
public class SessionFilter implements Filter {
    @Autowired
    SessionFilterService sessionFilterService;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        //System.out.println("init");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        String sessionId = null;
        Cookie[] cookies = ((HttpServletRequest)request).getCookies();
        if(cookies!= null) {
            for(Cookie cookie:cookies) {
                if("session_id".equals(cookie.getName())) {
                    sessionId = cookie.getValue();
                    break;
                }
            }
            if(sessionId!=null) {
                List<Session> sessionList = sessionFilterService.findSession(sessionId);
                if(sessionList!=null && !sessionList.isEmpty()) {
                    Session session = sessionList.get(0);
                    if(session.expiredAt > (new Date().getTime()/1000)) {
                        List<Users> usersList = sessionFilterService.findUsers(session.username);
                        sessionFilterService.updateSession(sessionId);
                        request.setAttribute("user", (usersList!=null && !usersList.isEmpty())?usersList.get(0):null);
                    }
                    else {
                        sessionFilterService.deleteSession(sessionId);
                    }
                }
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        //System.out.println("destroy");
    }
}
