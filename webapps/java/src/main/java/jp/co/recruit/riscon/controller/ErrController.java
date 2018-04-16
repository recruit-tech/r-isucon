package jp.co.recruit.riscon.controller;

import java.io.PrintWriter;
import java.io.StringWriter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ErrorAttributes;
import org.springframework.boot.autoconfigure.web.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * ErrController
 * For Unexpected exception
 * @author S.Hamaoka
 */
@Controller
public class ErrController implements ErrorController{

    @Autowired
    ErrorAttributes errorAttributes;

    private static final String PATH = "/error";

    @Override
    public String getErrorPath() {
        return PATH;
    }

    @ExceptionHandler(Exception.class)
    @RequestMapping(value = "/error", method = RequestMethod.POST)
    public String errorPost(Model model,HttpServletRequest request,HttpServletResponse response) {
        return error(model, request,response);
    }

    @ExceptionHandler(Exception.class)
    @RequestMapping(value = "/error", method = RequestMethod.GET)
    public String error(Model model,HttpServletRequest request,HttpServletResponse response) {
        Throwable cause = errorAttributes.getError(new ServletRequestAttributes(request));
        model.addAttribute("message", "エラーが発生しました");
        model.addAttribute("errorStatus", 500);
        StringWriter sw = new StringWriter();
        cause.printStackTrace(new PrintWriter(sw));
        model.addAttribute("errorStack", sw.toString());
        return "error";
    }
}