package jp.co.recruit.riscon.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.Time;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import jp.co.recruit.riscon.entity.BelongsOrganizations;
import jp.co.recruit.riscon.entity.ReservableRooms;
import jp.co.recruit.riscon.entity.Reservation;
import jp.co.recruit.riscon.entity.Users;
import jp.co.recruit.riscon.service.IndexService;
import jp.co.recruit.riscon.util.entity.ExtendsReservation;
import jp.co.recruit.riscon.util.entity.ExtendsRooms;
import jp.co.recruit.riscon.util.entity.RangeTime;

@Controller
public class IndexController {
    @Autowired
    IndexService indexService;

    @Autowired
    ResourceLoader resourceLoader;

    @GetMapping(value= {"/"})
    private String index(Model model,HttpServletRequest request,HttpServletResponse response,@RequestParam(name="date",required=false) String date) throws IOException{
        Users user = (Users) request.getAttribute("user");
        if(user==null) {
            return "redirect:/login";
        }
        model.addAttribute("user", user);
        try {
            String username = user.username;
            List<Integer> roomIds= new ArrayList<>();
            for(BelongsOrganizations belongsOrganizations:indexService.findBelongsOrganizations(username)) {
                for(ReservableRooms reservableRooms:indexService.findReservableRooms(belongsOrganizations.organizationsIdName.organizationId)) {
                    if(reservableRooms.roomOrganizationId.roomId!=null) {
                        if(!roomIds.contains(reservableRooms.roomOrganizationId.roomId)) {
                            roomIds.add(reservableRooms.roomOrganizationId.roomId);
                        }
                    }
                }
            }

            List<ExtendsRooms> roomsList = new ArrayList<>();
            DateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");
            if(date!=null) {
                model.addAttribute("date", date);
            }
            else {
                date = dateFormatter.format(new Date());
                model.addAttribute("date", dateFormatter.format(new Date()));
            }
            for(Integer roomId:roomIds) {
                List<RangeTime> times = createRangeTime();
                model.addAttribute("times", times);
                ExtendsRooms extendsRooms = new ExtendsRooms(indexService.findRooms(roomId),times);
                for(Reservation reservation: indexService.findReservations(date, roomId)){
                    Users users = indexService.findUsers(reservation.username);
                    Time reservationStart = reservation.startTime;
                    Time reservationEnd = reservation.endTime;
                    int colspan = (int)((reservationEnd.getTime()-reservationStart.getTime())/ (1000 * 60 * 30));
                    int index = getListIndex(reservationStart);
                    extendsRooms.rangeTime.set(index,new RangeTime(reservationStart.toString(),reservationEnd.toString(),colspan,new ExtendsReservation(reservation,users)));
                    if(colspan!=1) {
                        for(int i=1;i<colspan;i++) {
                            RangeTime rangeTime = extendsRooms.rangeTime.get(index+i);
                            rangeTime.colspan=-1;
                            extendsRooms.rangeTime.set(index+i, rangeTime);
                        }
                    }
                }
                Iterator<RangeTime> rangeTimeList = extendsRooms.rangeTime.iterator();
                while(rangeTimeList.hasNext()){
                    RangeTime rangeTime = rangeTimeList.next();
                    if(rangeTime.colspan==-1){
                        rangeTimeList.remove();
                    }
                }
                roomsList.add(extendsRooms);
            }
            model.addAttribute("rooms", roomsList);
        }
        catch(Exception e) {
            System.out.println(e);
            model.addAttribute("message", "エラーが発生しました");
        }
        return "index";
    }

    @GetMapping(value= {"/dx/{dx}/dy/{dy}/{filename:.+}"})
    private HttpEntity<byte[]> imageConvert(Model model,HttpServletRequest request,HttpServletResponse response,
            @PathVariable(value="dx") String dx,@PathVariable(value="dy") String dy,@PathVariable(value="filename") String filename) {
        try {
            Integer.parseInt(dx);
            Integer.parseInt(dy);
            String path = System.getenv("IMAGE_UPLOAD_PATH");
            if(filename == null || (!filename.endsWith(".jpg") && !filename.endsWith(".jpeg") && !filename.endsWith(".gif") && !filename.endsWith(".png") &&!filename.endsWith(".webp"))) {
                throw new Exception();
            }
            Process p = Runtime.getRuntime().exec("/bin/magick convert "+path+filename+" -resize "+dx+"x"+dy+" "+path+filename);
            p.waitFor();
            Resource resource = resourceLoader.getResource("file:"+path+filename);
            InputStream image = resource.getInputStream();
            byte[] bytes = readAll(image);

            HttpHeaders headers = new HttpHeaders();
            if(filename.endsWith(".jpg")){
                headers.setContentType(MediaType.IMAGE_JPEG);
            }else if (filename.endsWith(".gif")) {
                headers.setContentType(MediaType.IMAGE_GIF);
            }else if (filename.endsWith(".png")) {
                headers.setContentType(MediaType.IMAGE_PNG);
            }else if(filename.endsWith(".webp")){
                headers.setContentType(new MediaType("image/webp"));
            }
            headers.setContentLength(bytes.length);
            return new HttpEntity<byte[]>(bytes,headers);
        }catch (Exception e) {
            model.addAttribute("message", "画像を変換できません");
            model.addAttribute("errorStatus", 500);
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            model.addAttribute("errorStack", sw.toString());
            byte[] bytes = new byte[1];
            return new HttpEntity<byte[]>(bytes);
        }
    }

    @GetMapping(value= {"/initialize"})
    private String initialize(Model model,HttpServletRequest request,HttpServletResponse response) {
        try {
            String[] cmd = {
              "sh",
              "-c",
              "mysql -uroot -ppassword risukai < ../sql/01_tables_data.sql"
            };
            Process p = Runtime.getRuntime().exec(cmd);
            p.waitFor();
            System.out.println("done!!");
        } catch (Exception e) {
            System.out.println(e);
            model.addAttribute("errorStatus", 500);
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            model.addAttribute("errorStack", sw.toString());
            return "error";
        }
        return "initialize";
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

    private int getListIndex(Time reservationStart) {
        int returnInt=0;
        LocalTime lt = reservationStart.toLocalTime();
        returnInt += (lt.getMinute()/30);
        returnInt += (lt.getHour()-8)*2;
        return returnInt;
    }

    private byte[] readAll(InputStream inputStream) throws IOException {
        ByteArrayOutputStream bout = new ByteArrayOutputStream();
        byte [] buffer = new byte[1024];
        while(true) {
            int len = inputStream.read(buffer);
            if(len < 0) {
                break;
            }
            bout.write(buffer, 0, len);
        }
        return bout.toByteArray();
    }
}
