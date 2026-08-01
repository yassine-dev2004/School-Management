package com.school.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "parents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Parent {
    
    @Id
    private Long id; // Matches user_id

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    private String occupation;
    private String address;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Student> children;
}
