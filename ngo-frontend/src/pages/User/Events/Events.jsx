import { useEffect, useState } from "react";
import api from "../../../api/api";
import DashboardLayout from "../../../layouts/UserLayout/UserLayout";
import EventCard from "../../../components/EventCard/EventCard";
import "./Events.css";
import { toast } from "react-toastify";


function Events() {

    const [events, setEvents] = useState([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {

        try {

            const response = await api.get("/events");

            setEvents(response.data);

        } catch (err) {

            console.log(err);

        }

    };

    const apply = async (id) => {

        try {

            await api.post(`/applications/apply/${id}`);

            toast.success("Applied Successfully!");

        } catch (err) {

            toast.error(
                err.response?.data?.message ||
                "Application Failed"
            );

        }

    };

    return (

        <DashboardLayout>

            <div className="events-container">

                <h1>Available Events</h1>

                <div className="events-grid">

                    {events.map((event) => (

                        <EventCard
                            key={event.id}
                            event={event}
                            onApply={apply}
                        />

                    ))}

                </div>

            </div>

        </DashboardLayout>

    );
}

export default Events;