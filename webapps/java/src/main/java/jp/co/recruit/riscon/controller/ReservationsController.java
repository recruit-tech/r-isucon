package jp.co.recruit.riscon.controller;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jp.co.recruit.riscon.entity.BelongsOrganizations;
import jp.co.recruit.riscon.entity.ReservableRooms;
import jp.co.recruit.riscon.entity.Reservation;
import jp.co.recruit.riscon.entity.Rooms;
import jp.co.recruit.riscon.entity.Users;
import jp.co.recruit.riscon.service.ReservationsService;
import jp.co.recruit.riscon.util.entity.RangeTime;

@Controller
public class ReservationsController {
    @Autowired
    ReservationsService reservationsService;

    @GetMapping(value= {"/reservations*"})
    private String reservations(Model model,HttpServletRequest request, HttpServletResponse response,
            @RequestParam(name="start",required=false) String start,@RequestParam(name="date",required=false) String date,@RequestParam(name="room_id",required=false) Integer roomId) {
        Users user = (Users) request.getAttribute("user");
        if(user==null) {
            return "redirect:/login";
        }
        String username = user.username;
        try {
            List<Rooms> roomsList = getReservableRooms(username);
            if(!roomsList.stream().filter(org -> org.id.equals(roomId)).findFirst().isPresent()) {
                model.addAttribute("message", "予約できない部屋です");
                response.setStatus(403);
                model.addAttribute("roomId", roomId);
                model.addAttribute("reservableRooms", roomsList);
                model.addAttribute("start", start);
                model.addAttribute("title", null);
                model.addAttribute("user", user);
                model.addAttribute("date", date);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            DateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");
            if(date!=null) {
                model.addAttribute("date", date);
            }
            else {
                date = dateFormatter.format(new Date());
                model.addAttribute("date", dateFormatter.format(new Date()));
            }
            if(start!=null) {
                String[] timeData = start.split(":");
                LocalTime startTime = LocalTime.of(Integer.parseInt(timeData[0]), Integer.parseInt(timeData[1]), 0);
                model.addAttribute("end", startTime.plusMinutes(30).toString());
            }
            model.addAttribute("message", null);
            model.addAttribute("roomId", roomId);
            model.addAttribute("reservableRooms", roomsList);
            model.addAttribute("start", start);
            model.addAttribute("title", null);
            model.addAttribute("user", user);
            model.addAttribute("rangeTime", createRangeTime());
        }catch (Exception e) {
            model.addAttribute("message", "予約できない部屋です");
            response.setStatus(403);
        }
        return "reservation";
    }

    @PostMapping(value= {"/reservations"})
    private String reservationsValidate(Model model,HttpServletRequest request, HttpServletResponse response) {
        try {
            Integer roomId = Integer.parseInt(((String)request.getParameter("room_id")));
            String date = (String)request.getParameter("date");
            String[] starts = request.getParameterValues("start");
            String start;
            if (starts.length > 1) {
                start = starts[1];
            } else {
                start = starts[0];
            }
            String end = (String)request.getParameter("end");
            String title = (String)request.getParameter("title");
            Users user = (Users) request.getAttribute("user");
            String username = user.username;
            List<Rooms> roomsList = getReservableRooms(username);
            if(!roomsList.stream().filter(org -> org.id.equals(roomId)).findFirst().isPresent()) {
                model.addAttribute("message", "予約できない部屋です");
                response.setStatus(403);
                model.addAttribute("roomId", roomId);
                model.addAttribute("reservableRooms", roomsList);
                model.addAttribute("start", start);
                model.addAttribute("end", end);
                model.addAttribute("title", title);
                model.addAttribute("user", user);
                model.addAttribute("date", date);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            Reservation reservation = reservationsService.findReservation(roomId, date, start, end);
            if(reservation!=null) {
                model.addAttribute("message", "すでにその時間で予約されています");
                response.setStatus(403);
                model.addAttribute("roomId", roomId);
                model.addAttribute("reservableRooms", roomsList);
                model.addAttribute("start", start);
                model.addAttribute("end", end);
                model.addAttribute("title", title);
                model.addAttribute("user", user);
                model.addAttribute("date", date);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            reservationsService.insertReservation(roomId, username, title, date, start, end);
            return "redirect:/?date="+date;
        }catch (Exception e) {
            model.addAttribute("message", "エラーが発生しました");
            response.setStatus(500);
            model.addAttribute("rangeTime", createRangeTime());
            return "reservation";
        }
    }

    @GetMapping(value= {"/reservations/{reservationId}"})
    private String reservationsWithId(Model model,HttpServletRequest request, HttpServletResponse response,
            @PathVariable(value="reservationId") Integer reservationId) {
        Users user = (Users) request.getAttribute("user");
        if(user==null) {
            return "redirect:/login";
        }
        String username = user.username;
        try {
            Reservation reservation = reservationsService.findReserved(reservationId);
            if(reservation==null) {
                model.addAttribute("message", "予約がありません");
                response.setStatus(404);
                model.addAttribute("roomId", reservationId);
                model.addAttribute("reservableRooms", null);
                model.addAttribute("start", null);
                model.addAttribute("end", null);
                model.addAttribute("title", null);
                model.addAttribute("user", user);
                model.addAttribute("date", null);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            List<Rooms>  reservableRooms = getReservableRooms(username);
            if(!reservableRooms.stream().filter(org -> org.id.equals(reservation.roomId)).findFirst().isPresent()) {
                model.addAttribute("message", "予約できない部屋です");
                response.setStatus(403);
                model.addAttribute("roomId", reservationId);
                model.addAttribute("reservableRooms", reservableRooms);
                model.addAttribute("start", null);
                model.addAttribute("end", null);
                model.addAttribute("title", null);
                model.addAttribute("user", user);
                model.addAttribute("date", null);
                model.addAttribute("reservableRooms", reservableRooms);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            DateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");
            model.addAttribute("reservableRooms", reservableRooms);
            model.addAttribute("roomId", reservation.roomId);
            model.addAttribute("start", reservation.startTime.toString().substring(0, 5));
            model.addAttribute("end", reservation.endTime.toString().substring(0, 5));
            model.addAttribute("date", dateFormatter.format(new Date()));
            model.addAttribute("title", reservation.title);
            model.addAttribute("user", user);
            model.addAttribute("rangeTime", createRangeTime());
            return "reservation";
        }catch (Exception e) {
            model.addAttribute("message", "エラーが発生しました");
            response.setStatus(500);
            model.addAttribute("rangeTime", createRangeTime());
            return "reservation";
        }
    }

    @PostMapping(value= {"/reservations/{reservationId}"})
    private String reservationsWithIdValidate(Model model,HttpServletRequest request, HttpServletResponse response
            ,@PathVariable(value="reservationId") Integer reservationId) {
        Users user = (Users) request.getAttribute("user");
        if(user==null) {
            return "redirect:/login";
        }
        String username = user.username;
        try {
            Integer roomId = Integer.parseInt(((String)request.getParameter("room_id")));
            String date = (String)request.getParameter("date");
            String start = (String)request.getParameter("start");
            String end = (String)request.getParameter("end");
            String title = (String)request.getParameter("title");
            Reservation reservation = reservationsService.findReserved(reservationId);
            if(!user.username.equals(reservation.username)) {
                model.addAttribute("message", "本人が予約したものではありません");
                response.setStatus(404);
                model.addAttribute("roomId", roomId);
                model.addAttribute("reservableRooms", null);
                model.addAttribute("start", start);
                model.addAttribute("end", end);
                model.addAttribute("title", title);
                model.addAttribute("user", user);
                model.addAttribute("date", date);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            List<Rooms>  reservableRooms = getReservableRooms(username);
            if(!reservableRooms.stream().filter(org -> org.id.equals(roomId)).findFirst().isPresent()) {
                model.addAttribute("message", "予約できない部屋です");
                response.setStatus(403);
                model.addAttribute("roomId", roomId);
                model.addAttribute("reservableRooms", reservableRooms);
                model.addAttribute("start", start);
                model.addAttribute("end", end);
                model.addAttribute("title", title);
                model.addAttribute("user", user);
                model.addAttribute("date", date);
                model.addAttribute("reservableRooms", reservableRooms);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            Reservation alreadyReservation = reservationsService.checkAlreadyReservation(roomId, date, reservationId, start, end);
            if(alreadyReservation!=null) {
                model.addAttribute("message", "既にその時間に他の予約が存在します。");
                response.setStatus(403);
                model.addAttribute("roomId", roomId);
                model.addAttribute("reservableRooms", reservableRooms);
                model.addAttribute("start", start);
                model.addAttribute("end", end);
                model.addAttribute("title", title);
                model.addAttribute("user", user);
                model.addAttribute("date", date);
                model.addAttribute("reservableRooms", reservableRooms);
                model.addAttribute("rangeTime", createRangeTime());
                return "reservation";
            }
            reservationsService.updateReservation(date, start, end, title, roomId, reservationId);
            return "redirect:/?date="+date;
        }catch (Exception e) {
            model.addAttribute("message", "エラーが発生しました");
            response.setStatus(500);
            model.addAttribute("rangeTime", createRangeTime());
            return "reservation";
        }
    }

    private List<Rooms> getReservableRooms(String username){
        List<Rooms> roomsList = new ArrayList<>();
        for(BelongsOrganizations belongsOrganizations:reservationsService.findBelongsOrganizations(username)) {
            for(ReservableRooms reservableRooms:reservationsService.findReservableRooms(belongsOrganizations.organizationsIdName.organizationId)) {
                if(reservableRooms.roomOrganizationId.roomId!=null) {
                    if(!roomsList.stream().filter(org -> org.id.equals(reservableRooms.roomOrganizationId.roomId)).findFirst().isPresent()) {
                        roomsList.add(reservationsService.findRooms(reservableRooms.roomOrganizationId.roomId));
                    }
                }
            }
        }
        return roomsList;
    }

    private List<RangeTime> createRangeTime(){
        List<RangeTime> rangeTimes = new ArrayList<>();
        LocalDateTime startDate = LocalDateTime.of(2001, 1, 1, 8, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2001, 1, 1, 23, 0, 0);
        int duration = (int)((ChronoUnit.MILLIS.between(startDate,endDate)/ (1000 * 60 * 30)));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        for(int i=0;i<duration;i++) {
            RangeTime rangeTime = new RangeTime();
            rangeTime.startTime = startDate.format(formatter);
            rangeTime.endTime = startDate.plusMinutes(30).format(formatter);
            rangeTimes.add(rangeTime);
            startDate = startDate.plusMinutes(30);
        }
        return rangeTimes;
    }
}