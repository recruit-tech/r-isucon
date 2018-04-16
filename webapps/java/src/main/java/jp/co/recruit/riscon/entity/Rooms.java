package jp.co.recruit.riscon.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="rooms")
public class Rooms implements Serializable{
    @Id
    @Column(name="id")
    public Integer id;

    @Column(name="name")
    public String name;

    @Column(name="location")
    public String location;
}