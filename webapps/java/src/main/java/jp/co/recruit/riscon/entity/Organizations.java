package jp.co.recruit.riscon.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="organizations")
public class Organizations implements Serializable{
    @Id
    @Column(name="id")
    public Integer id;

    @Column(name="parent_id")
    public Integer parentId;

    @Column(name="name")
    public String name;
}